import {
	Association,
	CreationOptional,
	DataTypes,
	HasManyGetAssociationsMixin,
	HasManySetAssociationsMixin,
	HasManyAddAssociationMixin,
	HasManyAddAssociationsMixin,
	HasManyCreateAssociationMixin,
	HasManyRemoveAssociationMixin,
	HasManyRemoveAssociationsMixin,
	HasManyHasAssociationMixin,
	HasManyHasAssociationsMixin,
	HasManyCountAssociationsMixin,
	InferCreationAttributes,
	InferAttributes,
	Model,
	NonAttribute,
	Sequelize,
	Transaction,
	BelongsToCreateAssociationMixin,
	BelongsToGetAssociationMixin,
	BelongsToSetAssociationMixin,
} from 'sequelize'
import { Price, PriceInterface } from './Price'
import { fetchMultiData, fetchSingleData, validateStringField } from '../helper'
import { OrderItem } from './OrderItem'
import { ProductPrice } from './ProductPrice'
import { Category, CategoryInterface } from './Category'
import { Image, ImageInterface } from './Image'
import { BaseModelInterface } from './models'

interface ProductBaseInterface extends BaseModelInterface {
	name: string
	description: string
	stock: number
}

interface ProductAssociationsInterface {
	categories: CategoryInterface[] | string[]
	price?: PriceInterface | string
	prices: PriceInterface[] | string[]
	images: ImageInterface[] | string[]
	thumbnail?: ImageInterface | string
}

export interface ProductInterface
	extends ProductBaseInterface,
		ProductAssociationsInterface {}

type ProductAssociations =
	| 'categories'
	| 'productPrices'
	| 'images'
	| 'thumbnail'

export class Product extends Model<
	InferAttributes<Product, { omit: ProductAssociations }>,
	InferCreationAttributes<Product, { omit: ProductAssociations }>
> {
	declare id: CreationOptional<string>

	declare name: string
	declare description: CreationOptional<string>
	declare stock: CreationOptional<number>

	declare createdAt: CreationOptional<Date>
	declare updatedAt: CreationOptional<Date>
	declare deletedAt: CreationOptional<Date>

	// Product belongsToMany Categories
	declare categories?: NonAttribute<Category[]>
	declare getCategories: HasManyGetAssociationsMixin<Category>
	declare setCategories: HasManySetAssociationsMixin<Category, string>
	declare addCategory: HasManyAddAssociationMixin<Category, string>
	declare addCategories: HasManyAddAssociationsMixin<Category, string>
	declare createCategory: HasManyCreateAssociationMixin<Category>
	declare removeCategory: HasManyRemoveAssociationMixin<Category, string>
	declare removeCategories: HasManyRemoveAssociationsMixin<Category, string>
	declare hasCategory: HasManyHasAssociationMixin<Category, string>
	declare hasCategories: HasManyHasAssociationsMixin<Category, string>
	declare countCategories: HasManyCountAssociationsMixin

	// Product belongsToMany Prices
	declare productPrices?: NonAttribute<ProductPrice[]>
	declare getProductPrices: HasManyGetAssociationsMixin<ProductPrice>
	declare setProductPrices: HasManySetAssociationsMixin<ProductPrice, string>
	declare addProductPrice: HasManyAddAssociationMixin<ProductPrice, string>
	declare addProductPrices: HasManyAddAssociationsMixin<ProductPrice, string>
	declare createProductPrice: HasManyCreateAssociationMixin<ProductPrice>
	declare removeProductPrice: HasManyRemoveAssociationMixin<
		ProductPrice,
		string
	>
	declare removeProductPrices: HasManyRemoveAssociationsMixin<
		ProductPrice,
		string
	>
	declare hasProductPrice: HasManyHasAssociationMixin<ProductPrice, string>
	declare hasProductPrices: HasManyHasAssociationsMixin<ProductPrice, string>
	declare countProductPrices: HasManyCountAssociationsMixin

	declare thumbnail?: NonAttribute<Image>
	declare getThumbnail: BelongsToGetAssociationMixin<Image>
	declare setThumbnail: BelongsToSetAssociationMixin<Image, string>
	declare createThumbnail: BelongsToCreateAssociationMixin<Image>

	declare images?: NonAttribute<Image[]>
	declare getImages: HasManyGetAssociationsMixin<Image>
	declare setImages: HasManySetAssociationsMixin<Image, string>
	declare addImage: HasManyAddAssociationMixin<Image, string>
	declare addImages: HasManyAddAssociationsMixin<Image, string>
	declare createImage: HasManyCreateAssociationMixin<Image>
	declare removeImage: HasManyRemoveAssociationMixin<Image, string>
	declare removeImages: HasManyRemoveAssociationsMixin<Image, string>
	declare hasImage: HasManyHasAssociationMixin<Image, string>
	declare hasImages: HasManyHasAssociationsMixin<Image, string>
	declare countImages: HasManyCountAssociationsMixin

	declare static associations: {
		categories: Association<Product, Category>
		productPrices: Association<Product, ProductPrice>
		thumbnail: Association<Product, Image>
		images: Association<Product, Image>
	}

	static initModel(sequelize: Sequelize): typeof Product {
		Product.init(
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
					defaultValue: '',
					validate: {
						isString: validateStringField('name'),
						len: {
							args: [0, 128],
							msg: 'Name max length is 128 characters',
						},
					},
				},
				description: {
					type: DataTypes.STRING,
					defaultValue: '',
					validate: {
						isString: validateStringField('description'),
					},
				},
				stock: {
					type: DataTypes.INTEGER,
					defaultValue: 1,
					validate: {
						isInt: {
							msg: "Field 'stock' must be an integer",
						},
						min: {
							args: [0],
							msg: "Field 'stock' must be greater than or equal to 0",
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
		)

		return Product
	}

	static associate() {
		Product.belongsToMany(Category, {
			through: 'ProductCategory',
		})

		Product.hasMany(ProductPrice, {
			foreignKey: 'productId',
			onDelete: 'CASCADE',
		})

		Product.belongsTo(Image, {
			as: 'thumbnail',
			foreignKey: 'thumbnailId',
			onDelete: 'SET NULL',
		})

		Product.hasMany(Image, {
			foreignKey: 'productId',
			onDelete: 'CASCADE',
		})
	}

	public async data(dto: boolean = true): Promise<ProductInterface> {
		const fields = [
			'id',
			'name',
			'description',
			'stock',
			'createdAt',
			'updatedAt',
			...(this.deletedAt ? ['deletedAt'] : []),
		]

		const base_data = fields.reduce((acc, field) => {
			return {
				...acc,
				[field]: this[field as keyof Product],
			}
		}, {}) as ProductBaseInterface

		const [categories, price, prices, images, thumbnail] = await Promise.all([
			fetchMultiData<CategoryInterface, Category>(
				() => this.getCategories(),
				dto
			),
			fetchSingleData<PriceInterface, Price>(() => this.getActivePrice(), dto),
			fetchMultiData<PriceInterface, Price>(() => this.getPrices(), dto),
			fetchMultiData<ImageInterface, Image>(() => this.getImages(), dto),
			fetchSingleData<ImageInterface, Image>(() => this.getThumbnail(), dto),
		])

		const associated_data: ProductAssociationsInterface = {
			categories,
			price,
			prices,
			images,
			thumbnail,
		}

		return {
			...base_data,

			...associated_data,
		}
	}

	public async getPrices() {
		const result = await this.getProductPrices()

		return Promise.all(
			result.map((pp) => {
				return pp.getPrice()
			})
		)
	}

	public async getActivePrice(): Promise<Price | null> {
		const prices = await this.getProductPrices({
			where: {
				isActive: true,
			},
		})

		if (prices.length === 0 || prices.length > 1) {
			return null
		}

		const activePPrice = prices[0]

		return activePPrice.getPrice()
	}

	public async setActivePrice(
		price: Price,
		options?: { transaction?: Transaction }
	): Promise<void> {
		const prices = await this.getProductPrices({
			transaction: options?.transaction,
		})

		const targetPrice = prices.find((priceInc) => priceInc.id === price.id)
		if (!targetPrice) {
			throw new Error(
				`Price with ID ${price.id} is not associated with Product ID ${this.id}`
			)
		}

		if (targetPrice.isActive) {
			return
		}

		// set all prices to inactive
		await Promise.all(
			prices.map((priceInc) => {
				priceInc.isActive = false
			})
		)

		await targetPrice.update({ isActive: true })

		await targetPrice.save()
	}
}
