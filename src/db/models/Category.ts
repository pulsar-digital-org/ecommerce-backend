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
import { Product } from './Product';
import {
	validateStringField,
} from '../helper';
import { Image } from './Image';
import { CategoryType } from '../../types/model';

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

	public async data(): Promise<CategoryType> {
		const category = await this.reload({
			include: [
				{ model: Product, as: 'products' },
				{ model: Category, as: 'subcategories' },
				{ model: Image, as: 'thumbnail' }
			]
		});

		return category.toJSON();
	}
}
