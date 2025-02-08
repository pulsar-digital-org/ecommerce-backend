import { Includeable, Op, Transaction } from 'sequelize';
import db from '../db/db';
import { BadRequestError, NotFoundError } from '../errors';
import { Product } from '../db/models/Product';
import { Price } from '../db/models/Price';
import { Image } from '../db/models/Image';
import { ProductModifiable } from '../types/product';
import { categoryGet } from './category';
import { imageGet } from './image';
import { ProductType } from '../types/model';

async function productCreate(data: ProductModifiable): Promise<ProductType> {
	const { images: imageIds, thumbnail: thumbnailId, categories: categoryIds, ...productData } = data;

	const categories = await Promise.all(
		categoryIds.map((categoryId: string) =>
			categoryGet(categoryId)
		)
	);

	const thumbnail = await imageGet(thumbnailId);

	const images = imageIds ? await Promise.all(
		imageIds.map((imageId: string) => imageGet(imageId))
	) : [];

	const product = await db.transaction(async (t: Transaction) => {
		const product = await Product.create(productData, { transaction: t });
		await product.addCategories(categories, { transaction: t });

		await product.setThumbnail(thumbnail, { transaction: t });

		await Promise.all(
			images?.map((image) => {
				product.addImage(image, { transaction: t });
			})
		);

		return product;
	});

	return product.data();
}

async function productGet(
	productId: string,
	options?: { transaction: Transaction }
): Promise<Product> {
	const product = await Product.findByPk(productId, options);
	if (!product) {
		throw new NotFoundError("Couldn't find product");
	}

	return product;
}

// TODO:
async function productDelete(product: Product, force: boolean = false) {
	await product.destroy();
}

async function productUpdate(
	product: Product,
	data: ProductModifiable
): Promise<ProductType> {
	const { images: imageIds, thumbnail: thumbnailId, categories: categoryIds, ...productData } = data;

	const categories = await Promise.all(
		categoryIds.map((categoryId: string) =>
			categoryGet(categoryId)
		)
	);

	let thumbnail: Image | undefined;
	if (thumbnailId) {
		thumbnail = await imageGet(thumbnailId);
	}

	const images = imageIds ? await Promise.all(
		imageIds.map((imageId: string) => imageGet(imageId))
	) : [];

	const updatedProduct = await db.transaction(async (t: Transaction) => {
		product.set(productData);

		try {
			await product.validate();
		} catch (err) {
			throw new BadRequestError('Invalid product data');
		}

		await product.save({ transaction: t });

		const toCreateCategories = await Promise.all(categories.filter((category) => !product.hasCategory(category)));
		const toDeleteCategories = (await product.getCategories()).filter((category) => !categories.includes(category));

		for (const category of toDeleteCategories) {
			await product.removeCategory(category, { transaction: t });
		}

		for (const category of toCreateCategories) {
			await product.addCategory(category, { transaction: t });
		}

		if (thumbnail) {
			await product.setThumbnail(thumbnail, { transaction: t });
		}

		const toCreate = await Promise.all(images.filter((image) => !product.hasImage(image)));
		const toDelete = (await product.getImages()).filter((image) => !images.includes(image));

		for (const image of toDelete) {
			await image.destroy({ transaction: t });
		}

		for (const image of toCreate) {
			product.addImage(image, { transaction: t });
		}


		return product;
	});

	return updatedProduct.data();
}

async function productGetMultiple(
	options: { page?: number; size?: number } = {},
	filters: { [key: string]: string | undefined | null } = {},
	includes: Includeable[]
): Promise<{ products: ProductType[], total: number, page: number, size: number }> {
	const { page = 1, size = 10 } = options;

	if (page < 1 || size < 1) throw new BadRequestError("Invalid pagination params");

	const offset = (page - 1) * size;

	const filteredEntries = Object.entries(filters).filter(
		([_, value]) =>
			value !== undefined &&
			value !== 'undefined' &&
			value !== null &&
			value !== ''
	);

	const conditions = filteredEntries.map(([key, value]) => ({
		[key]: {
			[Op.iLike]: `%${value}%`,
		},
	}));

	const queryOptions = {
		limit: Math.min(size, 10),
		offset,
		where: conditions.length > 0 ? { [Op.and]: conditions } : {},
	};

	const { rows, count } = await Product.findAndCountAll({
		...queryOptions,
		include: includes,
		order: [['createdAt', 'DESC']],
	});

	const products = await Promise.all(rows.map(async (product) => product.data()));

	return { products, total: count, page, size };
}

// TODO:
async function productSetActivePrice(product: Product, price: Price) {
	const updatedProduct = await db.transaction(async (t: Transaction) => {
		await product.setActivePrice(price, { transaction: t });

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
};
