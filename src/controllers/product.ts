import { Op, Transaction } from 'sequelize';
import db from '../db/db';
import { BadRequestError, NotFoundError } from '../errors';
import { Product, ProductInterface } from '../db/models/Product';
import logger from '../logger';
import { Price } from '../db/models/Price';
import { Category } from '../db/models/Category';
import { Image } from '../db/models/Image';
import { ProductImage } from '../db/models/ProductImage';
import { ProductModifiable } from '../types/product';

/**
 * Create a new product with the provided data.
 *
 * @param productData - ProductCreationSchema data to create the product with.
 *
 * @returns The newly created Product interface, you can expect ProductInterface, not a string.
 */
async function productCreate(productData: ProductModifiable) {
	console.log(productData);
	// fix for category
	if (!productData.categories) {
		throw new BadRequestError('Cannot create a product with no categories!');
	}

	const categories = await Promise.all(
		productData.categories.map((categoryId: string) =>
			Category.findByPk(categoryId)
		)
	);

	if (categories.includes(null)) {
		throw new BadRequestError('One or more categories could not be found!');
	}

	const images = await Promise.all(
		productData.images?.map((imageId: string) => Image.findByPk(imageId))
	);

	if (images?.includes(null)) {
		throw new BadRequestError('One or more images not found');
	}

	const product = await db.transaction(async (t: Transaction) => {
		const product = await Product.create(
			{
				...productData,
			},
			{ transaction: t }
		);
		await product.addCategories(categories, { transaction: t });

		// add images to product
		if (images) {
			await Promise.all(
				images.map(async (image, index) => {
					// TODO: move this to Model definition
					const pimage = await ProductImage.create({ isThumbnail: index == 0 }, { transaction: t });

					await pimage.setImage(image, { transaction: t });
					await product.addProductImage(pimage, { transaction: t });
				})
			);
		}

		return product;
	});

	return product.data();
}

/**
 * Get product by ID.
 *
 * @param productId - The ID of the product to retrieve, should be already correct.
 *
 * @returns Product instance if found, or rejecting with a NotFoundError if not found
 */
async function productGet(
	productId: string,
	options?: { transaction: Transaction }
) {
	let product: Product | null;
	try {
		product = await Product.findOne({
			where: {
				id: productId,
			},
			paranoid: false,
			...options,
		});
	} catch (err) {
		throw new NotFoundError("Couldn't find product");
	}
	if (!product) {
		throw new NotFoundError("Couldn't find product");
	}

	return product;
}

/**
 * Deletes a product.
 *
 * @param product - The product instance to delete
 * @param force - Whether to force delete the item permanently instead of soft-deleting
 *
 * @returns void, throws if failed.
 */
async function productDelete(product: Product, force: boolean = false) {
	await product.delete({ force });
}

/**
 * Updates a product
 *
 * @param product - Product instance to update
 * @param productData - ProductModifiableSchema data to update the product with.
 *
 * @returns Updated product interface
 */
async function productUpdate(
	product: Product,
	productData: ProductModifiable
) {
	const { images: imageIds, ...otherData } = productData;

	const images = await Promise.all(
		imageIds.map(async (imageId: string) =>
			await Image.findByPk(imageId)
		)
	);

	if (images.includes(null)) {
		throw new BadRequestError('One or more images could not be found!');
	}

	const updatedProduct = await db.transaction(async (t: Transaction) => {
		product.set(otherData);

		try {
			await product.validate();
		} catch (err) {
			logger.error(err);
			throw new BadRequestError('Invalid product data');
		}

		await product.save({ transaction: t });

		const currentImages: Image[] = await product.getImages();

		const currentImageIds = currentImages.map((img) => img.id);
		const newImageIds = images.map((img) => img.id);

		const toCreate = images.filter((img) => !currentImageIds.includes(img.id));
		const toDelete = currentImages.filter((img) => !newImageIds.includes(img.id));

		const productProductImages = await product.getProductImages({ transaction: t });
		for (const img of toDelete) {
			const joinEntries = productProductImages.filter(
				async (pi) => (await pi.getImage()).id === img.id
			);
			console.log(joinEntries);
			for (const joinEntry of joinEntries) {
				await joinEntry.destroy({ transaction: t });
			}
		}

		for (const img of toCreate) {
			const pimage = await ProductImage.create({}, { transaction: t });
			await pimage.setImage(img, { transaction: t });
			await product.addProductImage(pimage, { transaction: t });
		}


		return product;
	});

	return updatedProduct.data();
}

/** ### Get filtered products.
 *
 * supports pagination.
 *
 * @throws {NotFoundError} If no product fits the filters.
 *
 * @returns {Product[]} Filtered products.
 */
async function productGetMultiple(
	options: { page?: number; size?: number } = {},
	filters: { [key: string]: string | undefined | null } = {},
	category?: string
): Promise<ProductInterface[]> {
	const { page = 1, size = 10 } = options;

	const offset = (page - 1) * size;

	for (const key in options) {
		if (filters[key] === undefined) {
			filters[key] = '';
		}
	}

	const conditions = Object.entries(filters)
		.filter(([_, value]) => value)
		.map(([key, value]) => ({
			[key]: {
				[Op.and]: [
					{ [Op.not]: null },
					{ [Op.not]: '' },
					{ [Op.like]: `%${value}%` },
				],
			},
		}));

	const queryOptions = {
		limit: Math.min(size, 10),
		offset,
		where: conditions.length > 0 ? { [Op.or]: conditions } : {},
	};

	const products = await Product.findAll({
		...queryOptions,
		include: [
			{
				model: Category,
				where: !category ? { name: { [Op.is]: null } } : { name: category },
				required: !!category,
			},
		],
		order: [['createdAt', 'DESC']],
	});

	if (!products) {
		throw new NotFoundError('No products found');
	}

	return Promise.all(products.map(async (product) => product.data()));
}

async function productSetActivePrice(product: Product, price: Price) {
	const updatedProduct = await db.transaction(async (t: Transaction) => {
		await product.setActivePrice(price, { transaction: t });

		return product;
	});

	return updatedProduct.data();
}

async function productAddCategory(product: Product, category: Category) {
	const updatedProduct = await db.transaction(async (t: Transaction) => {
		await product.addCategory(category, { transaction: t });

		return product;
	});

	return updatedProduct.data();
}

async function productRemoveCategory(product: Product, category: Category) {
	const updatedProduct = await db.transaction(async (t: Transaction) => {
		await product.removeCategory(category, { transaction: t });

		return product;
	});

	return updatedProduct.data();
}

export {
	productCreate,
	productGet,
	productDelete,
	productUpdate,
	productGetMultiple,
	productSetActivePrice,
	productAddCategory,
	productRemoveCategory,
};
