import {
	CreationOptional,
	DataTypes,
	InferCreationAttributes,
	InferAttributes,
	Model,
	Sequelize,
	BelongsToCreateAssociationMixin,
	BelongsToGetAssociationMixin,
	BelongsToSetAssociationMixin,
	NonAttribute,
	Association,
} from 'sequelize';
import { Product } from './Product';
import { Image } from './Image';

type ProductImageAssociations = 'product' | 'image';

export class ProductImage extends Model<
	InferAttributes<ProductImage, { omit: ProductImageAssociations }>,
	InferCreationAttributes<ProductImage, { omit: ProductImageAssociations }>
> {
	declare id: CreationOptional<string>;

	declare isThumbnail: CreationOptional<boolean>;

	declare createdAt: CreationOptional<Date>;
	declare updatedAt: CreationOptional<Date>;
	declare deletedAt: CreationOptional<Date>;

	// ProductImage belongsTo Product
	declare product?: NonAttribute<Product>;
	declare getProduct: BelongsToGetAssociationMixin<Product>;
	declare setProduct: BelongsToSetAssociationMixin<Product, string>;
	declare createProduct: BelongsToCreateAssociationMixin<Product>;

	// ProductImage belongsTo Image
	declare image?: NonAttribute<Image>;
	declare getImage: BelongsToGetAssociationMixin<Image>;
	declare setImage: BelongsToSetAssociationMixin<Image, string>;
	declare createImage: BelongsToCreateAssociationMixin<Image>;

	declare static associations: {
		product: Association<Image, Product>;
		image: Association<Image, Image>;
	};

	static initModel(sequelize: Sequelize): typeof ProductImage {
		ProductImage.init(
			{
				id: {
					type: DataTypes.UUID,
					primaryKey: true,
					allowNull: false,
					unique: true,
					defaultValue: DataTypes.UUIDV4,
				},
				isThumbnail: {
					type: DataTypes.BOOLEAN,
					allowNull: false,
					defaultValue: false,
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

		return ProductImage;
	}

	static associate() {
		ProductImage.belongsTo(Product, {
			foreignKey: 'productId',
			onDelete: 'CASCADE',
		});

		ProductImage.belongsTo(Image, {
			foreignKey: 'imageId',
			onDelete: 'CASCADE',
		});
	}
}
