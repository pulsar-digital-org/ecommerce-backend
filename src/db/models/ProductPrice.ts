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
	Association
} from 'sequelize';
import { Product } from './Product';
import { Price } from './Price';

type ProductPriceAssociations = 'product' | 'price';

export class ProductPrice extends Model<
	InferAttributes<ProductPrice, { omit: ProductPriceAssociations }>,
	InferCreationAttributes<ProductPrice, { omit: ProductPriceAssociations }>
> {
	declare id: CreationOptional<string>;

	declare isActive: CreationOptional<boolean>;

	declare createdAt: CreationOptional<Date>;
	declare updatedAt: CreationOptional<Date>;
	declare deletedAt: CreationOptional<Date>;

	// ProductPrice belongsTo Product
	declare product?: NonAttribute<Product>;
	declare getProduct: BelongsToGetAssociationMixin<Product>;
	declare setProduct: BelongsToSetAssociationMixin<Product, string>;
	declare createProduct: BelongsToCreateAssociationMixin<Product>;

	// ProductPrice belongsTo Price
	declare price?: NonAttribute<Price>;
	declare getPrice: BelongsToGetAssociationMixin<Price>;
	declare setPrice: BelongsToSetAssociationMixin<Price, string>;
	declare createPrice: BelongsToCreateAssociationMixin<Price>;

	declare static associations: {
		product: Association<Price, Product>;
		price: Association<Price, Price>;
	};

	static initModel(sequelize: Sequelize): typeof ProductPrice {
		ProductPrice.init(
			{
				id: {
					type: DataTypes.UUID,
					primaryKey: true,
					allowNull: false,
					unique: true,
					defaultValue: DataTypes.UUIDV4
				},
				isActive: {
					type: DataTypes.BOOLEAN,
					allowNull: false,
					defaultValue: false
				},
				createdAt: {
					type: DataTypes.DATE
				},
				updatedAt: {
					type: DataTypes.DATE
				},
				deletedAt: {
					type: DataTypes.DATE,
					allowNull: true
				}
			},
			{
				sequelize,
				paranoid: true
			}
		);

		return ProductPrice;
	}

	static associate() {
		ProductPrice.belongsTo(Product, {
			foreignKey: 'productId',
			onDelete: 'CASCADE'
		});

		ProductPrice.belongsTo(Price, {
			foreignKey: 'priceId',
			onDelete: 'CASCADE'
		});
	}
}
