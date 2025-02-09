import {
	Association,
	CreationOptional,
	DataTypes,
	InferCreationAttributes,
	InferAttributes,
	Model,
	NonAttribute,
	Sequelize,
	BelongsToManyAddAssociationMixin,
	BelongsToManyAddAssociationsMixin,
	BelongsToManyCountAssociationsMixin,
	BelongsToManyCreateAssociationMixin,
	BelongsToManyGetAssociationsMixin,
	BelongsToManyHasAssociationMixin,
	BelongsToManyHasAssociationsMixin,
	BelongsToManyRemoveAssociationMixin,
	BelongsToManyRemoveAssociationsMixin,
	BelongsToManySetAssociationsMixin,
	HasManyAddAssociationMixin,
	HasManyAddAssociationsMixin,
	HasManyCountAssociationsMixin,
	HasManyGetAssociationsMixin,
	HasManyHasAssociationMixin,
	HasManyHasAssociationsMixin,
	HasManyRemoveAssociationMixin,
	HasManyRemoveAssociationsMixin,
	HasManySetAssociationsMixin,
	BelongsToCreateAssociationMixin,
	BelongsToGetAssociationMixin,
	BelongsToSetAssociationMixin,
	HasOneCreateAssociationMixin,
	HasOneSetAssociationMixin,
	HasOneGetAssociationMixin,
} from 'sequelize';
import { Product, ProductInterface } from './Product';
import {
	fetchMultiData,
	fetchSingleData,
	validateStringField,
} from '../helper';
import { Image, ImageInterface } from './Image';

interface CategoryBaseInterface {
	id: string;

	name: string;

	createdAt: Date;
	updatedAt: Date;
	deletedAt?: Date;
}

interface CategoryAssociationsInterface {
	products: ProductInterface[] | string[];
	subcategories?: CategoryInterface[] | string[];
	parentCategory?: CategoryInterface | string;
	thumbnail?: ImageInterface | string;
}

export interface CategoryInterface
	extends CategoryBaseInterface,
	CategoryAssociationsInterface { }

type CategoryAssociations = 'products' | 'subcategories' | 'parentCategory' | 'thumbnail';

export class Category extends Model<
	InferAttributes<Category, { omit: CategoryAssociations }>,
	InferCreationAttributes<Category, { omit: CategoryAssociations }>
> {
	declare id: CreationOptional<string>;

	declare name: string;
	declare parentCategoryId?: CreationOptional<string | null>;

	declare createdAt: CreationOptional<Date>;
	declare updatedAt: CreationOptional<Date>;
	declare deletedAt: CreationOptional<Date>;

	declare products?: NonAttribute<Product[]>;
	declare getProducts: BelongsToManyGetAssociationsMixin<Product>;
	declare setProducts: BelongsToManySetAssociationsMixin<Product, string>;
	declare addProduct: BelongsToManyAddAssociationMixin<Product, string>;
	declare addProducts: BelongsToManyAddAssociationsMixin<Product, string>;
	declare createProduct: BelongsToManyCreateAssociationMixin<Product>;
	declare removeProduct: BelongsToManyRemoveAssociationMixin<Product, string>;
	declare removeProducts: BelongsToManyRemoveAssociationsMixin<Product, string>;
	declare hasAddress: BelongsToManyHasAssociationMixin<Product, string>;
	declare hasAddresses: BelongsToManyHasAssociationsMixin<Product, string>;
	declare countAddresses: BelongsToManyCountAssociationsMixin;

	declare subcategories?: NonAttribute<Category[]>;
	declare getSubcategories: HasManyGetAssociationsMixin<Category>;
	declare addSubcategory: HasManyAddAssociationMixin<Category, string>;
	declare addSubcategories: HasManyAddAssociationsMixin<Category, string>;
	declare setSubcategories: HasManySetAssociationsMixin<Category, string>;
	declare removeSubcategory: HasManyRemoveAssociationMixin<Category, string>;
	declare removeSubcategories: HasManyRemoveAssociationsMixin<Category, string>;
	declare hasSubcategory: HasManyHasAssociationMixin<Category, string>;
	declare hasSubcategories: HasManyHasAssociationsMixin<Category, string>;
	declare countSubcategories: HasManyCountAssociationsMixin;

	declare parentCategory?: NonAttribute<Category>;
	declare getParentCategory: BelongsToGetAssociationMixin<Category>;
	declare setParentCategory: BelongsToSetAssociationMixin<Category, string>;
	declare createParentCategory: BelongsToCreateAssociationMixin<Category>;

	declare thumbnail?: NonAttribute<Image>;
	declare getThumbnail: HasOneGetAssociationMixin<Image>;
	declare setThumbnail: HasOneSetAssociationMixin<Image, string>;
	declare createThumbnail: HasOneCreateAssociationMixin<Image>;

	declare static associations: {
		products: Association<Category, Product>;
		subcategories: Association<Category, Category>;
		parentCategory: Association<Category, Category>;
		image: Association<Category, Image>;
	};

	static initModel(sequelize: Sequelize): typeof Category {
		Category.init(
			{
				id: {
					type: DataTypes.UUID,
					primaryKey: true,
					allowNull: false,
					unique: true,
					defaultValue: DataTypes.UUIDV4,
				},
				name: {
					type: DataTypes.STRING,
					allowNull: false,
					validate: {
						isString: validateStringField('name'),
						len: {
							args: [0, 128],
							msg: 'Name max length is 128 characters',
						},
					},
				},
				createdAt: {
					type: DataTypes.DATE,
				},
				updatedAt: {
					type: DataTypes.DATE,
				},
				deletedAt: {
					type: DataTypes.DATE,
					allowNull: true,
				},
			},
			{
				sequelize,
				paranoid: true,
			}
		);

		return Category;
	}

	static associate() {
		Category.belongsToMany(Product, {
			through: 'ProductCategory',
			as: 'products'
		});

		Category.hasMany(Category, {
			as: 'subcategories',
			foreignKey: 'parentCategoryId',
		});

		Category.belongsTo(Category, {
			foreignKey: 'parentCategoryId',
			as: 'parentCategory',
		});

		Category.hasOne(Image, {
			foreignKey: 'imageId',
			as: 'thumbnail'
		});
	}

	public async data(dto: boolean = true): Promise<CategoryInterface> {
		const fields = [
			'id',
			'name',
			'createdAt',
			'updatedAt',
			...(this.deletedAt ? ['deletedAt'] : []),
		];

		const base_data = fields.reduce((acc, field) => {
			return {
				...acc,
				[field]: this[field as keyof Category],
			};
		}, {}) as CategoryBaseInterface;

		const [products, subcategories, parentCategory, thumbnail] = await Promise.all([
			fetchMultiData<ProductInterface, Product>(() => this.getProducts(), dto),
			fetchMultiData<CategoryInterface, Category>(
				() => this.getSubcategories({ order: [['createdAt', 'DESC']] }),
				dto
			),
			fetchSingleData<CategoryInterface, Category>(
				() => this.getParentCategory({ order: [['createdAt', 'DESC']] }),
				dto
			),
			fetchSingleData<ImageInterface, Image>(
				() => this.getThumbnail(),
				dto
			),
		]);

		const associated_data: CategoryAssociationsInterface = {
			products,
			subcategories,
			parentCategory,
			thumbnail
		};

		return {
			...base_data,

			...associated_data,
		};
	}
}
