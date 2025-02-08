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
	BelongsToManyAddAssociationMixin,
	BelongsToManyAddAssociationsMixin,
	BelongsToManyCountAssociationsMixin,
	BelongsToManyCreateAssociationMixin,
	BelongsToManyGetAssociationsMixin,
	BelongsToManyHasAssociationMixin,
	BelongsToManyHasAssociationsMixin,
	BelongsToManyRemoveAssociationMixin,
	BelongsToManyRemoveAssociationsMixin,
	BelongsToManySetAssociationsMixin
} from 'sequelize';
import {
	fetchMultiData,
	fetchSingleData,
	validateStringField
} from '../helper';
import logger from '../../logger';
import db from '../db';
import { AddressType, addressTypes } from '../types';
import { User, UserInterface } from './User';
import { BadRequestError } from '../../errors';
import { Order, OrderInterface } from './Order';

interface AddressBaseInterface {
	id: string;

	type: AddressType;

	name: string;
	surname: string;

	email?: string;
	phone?: string;

	addressLine1: string;
	addressLine2?: string;
	country: string;
	city: string;
	postalCode: string;

	createdAt: Date;
	updatedAt: Date;
	deletedAt?: Date;
}

interface AddressAssociationsInterface {
	user: UserInterface | string;
	orders: OrderInterface[] | string[];
}

export interface AddressInterface
	extends AddressBaseInterface,
	AddressAssociationsInterface { }

type AddressAssociations = 'user' | 'orders';

export class Address extends Model<
	InferAttributes<Address, { omit: AddressAssociations }>,
	InferCreationAttributes<Address, { omit: AddressAssociations }>
> {
	declare id: CreationOptional<string>;

	declare type: CreationOptional<AddressType>;

	declare name: string;
	declare surname: string;

	declare email: CreationOptional<string>;
	declare phone: CreationOptional<string>;

	declare addressLine1: string;
	declare addressLine2: CreationOptional<string>;
	declare country: string;
	declare city: string;
	declare postalCode: string;

	declare createdAt: CreationOptional<Date>;
	declare updatedAt: CreationOptional<Date>;
	declare deletedAt: CreationOptional<Date>;

	// Address belongsTo User
	declare user?: NonAttribute<User>;
	declare getUser: BelongsToGetAssociationMixin<User>;
	declare setUser: BelongsToSetAssociationMixin<User, string>;
	declare createUser: BelongsToCreateAssociationMixin<User>;

	// Address belongsToMany Orders
	declare orders?: NonAttribute<Order[]>;
	declare getOrders: BelongsToManyGetAssociationsMixin<Order>;
	declare setOrders: BelongsToManySetAssociationsMixin<Order, string>;
	declare addOrder: BelongsToManyAddAssociationMixin<Order, string>;
	declare addOrders: BelongsToManyAddAssociationsMixin<Order, string>;
	declare createOrder: BelongsToManyCreateAssociationMixin<Order>;
	declare removeOrder: BelongsToManyRemoveAssociationMixin<Order, string>;
	declare removeOrders: BelongsToManyRemoveAssociationsMixin<Order, string>;
	declare hasOrder: BelongsToManyHasAssociationMixin<Order, string>;
	declare hasOrders: BelongsToManyHasAssociationsMixin<Order, string>;
	declare countOrders: BelongsToManyCountAssociationsMixin;

	declare static associations: {
		user: Association<Address, User>;
		billingOrders: Association<Address, Order>;
		shippingOrders: Association<Address, Order>;
	};

	static initModel(sequelize: Sequelize): typeof Address {
		Address.init(
			{
				id: {
					type: DataTypes.UUID,
					primaryKey: true,
					allowNull: false,
					unique: true,
					defaultValue: DataTypes.UUIDV4
				},
				type: {
					type: DataTypes.STRING,
					allowNull: false,
					validate: {
						isIn: [addressTypes]
					},
					defaultValue: AddressType.billing
				},
				name: {
					type: DataTypes.STRING,
					validate: {
						isString: validateStringField('name'),
						len: {
							args: [0, 128],
							msg: 'Name max length is 128 characters'
						}
					}
				},
				surname: {
					type: DataTypes.STRING,
					defaultValue: '',
					validate: {
						isString: validateStringField('surname'),
						len: {
							args: [0, 128],
							msg: 'Surname max length is 128 characters'
						}
					}
				},
				email: {
					type: DataTypes.STRING,
					defaultValue: '',
					validate: {
						isEmail: {
							msg: 'Email is not valid'
						}
					}
				},
				phone: {
					type: DataTypes.STRING,
					defaultValue: '',
					validate: {
						isString: validateStringField('phone'),
						len: {
							args: [0, 128],
							msg: 'Phone max length is 128 characters'
						}
					}
				},
				addressLine1: {
					type: DataTypes.STRING,
					validate: {
						isString: validateStringField('addressLine1'),
						len: {
							args: [0, 1024],
							msg: 'Address Line 1 max length is 1024 characters'
						}
					}
				},
				addressLine2: {
					type: DataTypes.STRING,
					allowNull: true,
					validate: {
						isString: validateStringField('addressLine2'),
						len: {
							args: [0, 1024],
							msg: 'Address Line 2 max length is 1024 characters'
						}
					}
				},
				country: {
					type: DataTypes.STRING,
					validate: {
						isString: validateStringField('country'),
						len: {
							args: [0, 1024],
							msg: 'Country max length is 1024 characters'
						}
					}
				},
				city: {
					type: DataTypes.STRING,
					validate: {
						isString: validateStringField('city'),
						len: {
							args: [0, 1024],
							msg: 'City Line 2 max length is 1024 characters'
						}
					}
				},
				postalCode: {
					type: DataTypes.STRING,
					validate: {
						isString: validateStringField('postalCode'),
						len: {
							args: [0, 1024],
							msg: 'Postal code max length is 1024 characters'
						}
					}
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
				paranoid: true,
				hooks: {
					beforeValidate(address) {
						if (address.type === AddressType.billing) {
							if (!address.email) {
								throw new BadRequestError(
									'Email is required for billing addresses'
								);
							}
							if (!address.phone) {
								throw new BadRequestError(
									'Phone number is required for billing addresses'
								);
							}
						}
					}
				}
			}
		);

		return Address;
	}

	static associate() {
		// Address deps

		Address.belongsTo(User, {
			foreignKey: 'userId',
			onDelete: 'CASCADE'
		});

		Address.belongsToMany(Order, {
			through: 'OrderAddress'
		});

		// End deps
	}

	public async data(dto: boolean = true): Promise<AddressInterface> {
		const fields = [
			'id',
			'type',
			'name',
			'surname',
			'email',
			'phone',
			'addressLine1',
			'addressLine2',
			'country',
			'city',
			'postalCode',
			'createdAt',
			'updatedAt',
			...(this.deletedAt ? ['deletedAt'] : [])
		];

		const base_data = fields.reduce((acc, field) => {
			return {
				...acc,
				[field]: this[field as keyof Address]
			};
		}, {}) as AddressBaseInterface;

		const [user, orders] = await Promise.all([
			fetchSingleData<UserInterface, User>(() => this.getUser(), dto),
			fetchMultiData<OrderInterface, Order>(() => this.getOrders(), dto)
		]);

		if (user === undefined) {
			throw new Error('User not found');
		}

		const associated_data: AddressAssociationsInterface = {
			user,
			orders: orders as OrderInterface[] | string[]
		};

		return {
			...base_data,

			...associated_data
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
