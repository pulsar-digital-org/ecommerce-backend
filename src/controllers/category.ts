import { Op, Transaction } from 'sequelize';
import db from '../db/db';
import { Category } from '../db/models/Category';
import { BadRequestError } from '../errors';
import { CategoryModifiable } from '../types/category';
import { CategoryType } from '../types/model';
import { imageGet } from './image';

async function categoryCreate(data: CategoryModifiable): Promise<CategoryType> {
	const { imageId, parentId, ...categoryData } = data;

	const image = await imageGet(imageId);

	const category = await db.transaction(async (t: Transaction) => {
		const category = await Category.create(categoryData, { transaction: t });

		if (parentId && parentId !== category.id) {
			const parent = await categoryGet(parentId, { transaction: t });

			await category.setParentCategory(parent, { transaction: t });
		}

		await category.setThumbnail(image, { transaction: t });

		return category;
	});

	return category.data();
}

async function categoryGet(categoryId: string, options?: { transaction?: Transaction }) {
	const category = await Category.findByPk(categoryId, options);
	if (!category) {
		throw new BadRequestError('Category not found');
	}

	return category;
}

async function categoryGetMultiple(
	options: { page?: number; size?: number } = {},
	filters: { [key: string]: string | undefined | null } = {}
): Promise<{ categories: CategoryType[], total: number, page: number, size: number }> {
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

	const { rows, count } = await Category.findAndCountAll({
		...queryOptions,
		order: [['createdAt', 'DESC']],
	});

	const categories = await Promise.all(rows.map(async (category) => category.data()));

	return { categories, total: count, page, size };
}

async function categoryUpdate(
	category: Category,
	data: CategoryModifiable
) {
	const { imageId, parentId, ...categoryData } = data;

	category.set({ ...categoryData });

	try {
		await category.validate();
	} catch (err) {
		throw new BadRequestError('Invalid category data');
	}

	await db.transaction(async (t: Transaction) => {
		if (parentId && parentId !== category.id) {
			const parentCategory = await categoryGet(parentId, { transaction: t });

			await category.setParentCategory(parentCategory, {
				transaction: t,
			});
		}

		if (imageId) {
			const image = await imageGet(imageId);

			await category.setThumbnail(image, { transaction: t });
		}

		await category.save({ transaction: t });
	});

	return category.data();
}

// TODO:
async function categoryDelete(category: Category) {
	await db.transaction(async (t: Transaction) => {
		// move all subcategories to parent
		const parent = await category.getParentCategory({ transaction: t });
		const subcategories = await category.getSubcategories({ transaction: t });

		if (!parent && subcategories.length > 0) {
			throw new BadRequestError(
				"Please remove subcategories, since they can't be moved and this would lead to deleting all subcategories"
			);
		}

		// TODO: check if the category and subcategories have any products

		await Promise.all(
			subcategories.map((sub: Category) =>
				sub.setParentCategory(parent, { transaction: t })
			)
		);

		await category.destroy({ transaction: t });
	});
}

// TODO:
async function categorySubAdd(category: Category, category_add: Category) {
	if (category.id === category_add.id) {
		throw new BadRequestError('A category cannot be a subcategory of itself.');
	}

	// todo check for cyclic relationship, implement the category parent
	let current_cate = category;
	while (current_cate) {
		if (current_cate.id == category_add.id) {
			throw new BadRequestError(
				'Cannot create this category, because one of the parents is this category.'
			);
		}

		current_cate = await category.getParentCategory();
	}

	const categories = await category.getSubcategories();
	if (categories.filter((cat) => cat.id === category_add.id).length > 0) {
		throw new BadRequestError(
			'We already have this category as a subcategory.'
		);
	}

	await category.addSubcategory(category_add);
}

// TODO:
async function categorySubRemove(
	category: Category,
	category_remove: Category
) {
	if (category.id === category_remove.id) {
		throw new BadRequestError('A category cannot remove itself.');
	}

	const categories = await category.getSubcategories();
	if (categories.filter((cat) => cat.id === category_remove.id).length <= 0) {
		throw new BadRequestError("We don't have this subcategory.");
	}

	await category.removeSubcategory(category_remove);
}

export {
	categoryCreate,
	categoryGet,
	categoryGetMultiple,
	categoryUpdate,
	categoryDelete,
	categorySubAdd,
	categorySubRemove,
};
