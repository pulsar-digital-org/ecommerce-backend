import {
	Association,
	CreationOptional,
	DataTypes,
	InferCreationAttributes,
	InferAttributes,
	Model,
	NonAttribute,
	Sequelize,
	Transaction,
	BelongsToCreateAssociationMixin,
	BelongsToGetAssociationMixin,
	BelongsToSetAssociationMixin,
	HasOneCreateAssociationMixin,
	HasOneGetAssociationMixin,
	HasOneSetAssociationMixin,
} from 'sequelize';
import { fetchSingleData, validateStringField } from '../helper';
import logger from '../../logger';
import db from '../db';
import { User, UserInterface } from './User';
import { ProductImage } from './ProductImage';
import { ProductInterface } from './Product';

interface ImageBaseInterface {
	id: string;

	url: string;

	active: boolean;
	name: string;
	size: number;

	createdAt: Date;
	updatedAt: Date;
	deletedAt?: Date;
}

interface ImageAssociationsInterface {
	user: UserInterface | string;
	product?: ProductInterface | string;
}

export interface ImageInterface
	extends ImageBaseInterface,
	ImageAssociationsInterface { }

type ImageAssociations = 'user' | 'productImage';

export class Image extends Model<
	InferAttributes<Image, { omit: ImageAssociations }>,
	InferCreationAttributes<Image, { omit: ImageAssociations }>
> {
	declare id: CreationOptional<string>;

	declare url: CreationOptional<string>;

	declare active: CreationOptional<boolean>;
	declare name: string;
	declare size: CreationOptional<number>;

	declare createdAt: CreationOptional<Date>;
	declare updatedAt: CreationOptional<Date>;
	declare deletedAt: CreationOptional<Date>;

	// Image belongsTo User
	declare user?: NonAttribute<User>;
	declare getUser: BelongsToGetAssociationMixin<User>;
	declare setUser: BelongsToSetAssociationMixin<User, string>;
	declare createUser: BelongsToCreateAssociationMixin<User>;

	declare productImage?: NonAttribute<ProductImage>;
	declare getProductImage: HasOneGetAssociationMixin<ProductImage>;
	declare setProductImage: HasOneSetAssociationMixin<ProductImage, string>;
	declare createProductImage: HasOneCreateAssociationMixin<ProductImage>;

	declare static associations: {
		user: Association<Image, User>;
	};

	static initModel(sequelize: Sequelize): typeof Image {
		Image.init(
			{
				id: {
					type: DataTypes.UUID,
					primaryKey: true,
					allowNull: false,
					unique: true,
					defaultValue: DataTypes.UUIDV4,
				},
				url: {
					type: DataTypes.STRING,
					validate: {
						isUrl: {
							msg: 'Url must be valid url.',
						},
					},
				},
				active: {
					type: DataTypes.BOOLEAN,
					defaultValue: true,
				},
				name: {
					type: DataTypes.STRING,
					validate: {
						isString: validateStringField('name'),
						len: {
							args: [0, 128],
							msg: 'Name max length is 128 characters',
						},
					},
				},
				size: {
					type: DataTypes.INTEGER,
					defaultValue: 0
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

		return Image;
	}

	static associate() {
		Image.belongsTo(User, {
			foreignKey: 'userId',
			onDelete: 'CASCADE',
		});

		Image.hasOne(ProductImage, {
			foreignKey: 'imageId',
		});
	}

	public async data(dto: boolean = true): Promise<ImageInterface> {
		const fields = [
			'id',
			'url',
			'active',
			'name',
			'size',
			'createdAt',
			'updatedAt',
			...(this.deletedAt ? ['deletedAt'] : []),
		];

		const base_data = fields.reduce((acc, field) => {
			return {
				...acc,
				[field]: this[field as keyof Image],
			};
		}, {}) as ImageBaseInterface;

		const [user] = await Promise.all([
			fetchSingleData<UserInterface, User>(() => this.getUser(), dto),
		]);

		if (user === undefined) {
			throw new Error('User not found');
		}

		const associated_data: ImageAssociationsInterface = {
			user,
		};

		return {
			...base_data,

			...associated_data,
		};
	}

	public async delete(options?: {
		force?: boolean;
		transaction?: Transaction;
	}): Promise<void> {
		try {
			const force = options?.force ?? false;
			const transaction = options?.transaction;

			if (force) {
				if (transaction) {
					await this.cleanUp({ force, transaction });
				} else {
					await db.transaction(async (transaction: Transaction) => {
						await this.cleanUp({ force, transaction });
					});
				}
			} else {
				if (transaction) {
					await this.destroy({ transaction });
				} else {
					await db.transaction(async (transaction: Transaction) => {
						await this.destroy({ transaction });
					});
				}
			}
		} catch (err: unknown) {
			logger.error('Delete Address error, ', err);
			throw err;
		}
	}

	public async cleanUp(options: {
		force: boolean;
		transaction: Transaction;
	}): Promise<void> {
		await this.destroy(options);
	}
}
