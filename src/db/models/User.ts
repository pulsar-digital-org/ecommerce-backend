import {
	Association,
	CreationOptional,
	DataTypes,
	InferCreationAttributes,
	InferAttributes,
	Model,
	NonAttribute,
	Sequelize,
	HasManyAddAssociationMixin,
	HasManyAddAssociationsMixin,
	HasManyCountAssociationsMixin,
	HasManyCreateAssociationMixin,
	HasManyGetAssociationsMixin,
	HasManyHasAssociationMixin,
	HasManyHasAssociationsMixin,
	HasManyRemoveAssociationMixin,
	HasManyRemoveAssociationsMixin,
	HasManySetAssociationsMixin
} from 'sequelize';
import { Order, OrderInterface } from './Order';
import {
	fetchMultiData,
	fetchSingleData,
	validateStringField
} from '../helper';
import { OrderStatus, UserRole, userRoles } from '../types';
import { Address, AddressInterface } from './Address';

interface UserBaseInterface {
	id: string;

	role: UserRole;

	username?: string;
	email?: string;

	createdAt: Date;
	updatedAt: Date;
	deletedAt?: Date;
}

interface UserAssociationsInterface {
	orders: OrderInterface[] | string[];
	activeOrder?: OrderInterface | string;
	addresses: AddressInterface[] | string[];
}

export interface UserInterface
	extends UserBaseInterface,
	UserAssociationsInterface { }

type UserAssociations = 'orders' | 'addresses';

export class User extends Model<
	InferAttributes<User, { omit: UserAssociations }>,
	InferCreationAttributes<User, { omit: UserAssociations }>
> {
	declare id: CreationOptional<string>;

	declare role: CreationOptional<UserRole>;

	declare username: CreationOptional<string>;
	declare email: CreationOptional<string>;
	declare passwordHash: CreationOptional<string>;

	declare createdAt: CreationOptional<Date>;
	declare updatedAt: CreationOptional<Date>;

	// User hasMany Orders
	declare orders?: NonAttribute<Order[]>;
	declare getOrders: HasManyGetAssociationsMixin<Order>;
	declare setOrders: HasManySetAssociationsMixin<Order, string>;
	declare addOrder: HasManyAddAssociationMixin<Order, string>;
	declare addOrders: HasManyAddAssociationsMixin<Order, string>;
	declare createOrder: HasManyCreateAssociationMixin<Order>;
	declare removeOrder: HasManyRemoveAssociationMixin<Order, string>;
	declare removeOrders: HasManyRemoveAssociationsMixin<Order, string>;
	declare hasOrder: HasManyHasAssociationMixin<Order, string>;
	declare hasOrders: HasManyHasAssociationsMixin<Order, string>;
	declare countOrders: HasManyCountAssociationsMixin;

	// User hasMany Addresses
	declare addresses?: NonAttribute<Address[]>;
	declare getAddresses: HasManyGetAssociationsMixin<Address>;
	declare setAddresses: HasManySetAssociationsMixin<Address, string>;
	declare addAddress: HasManyAddAssociationMixin<Address, string>;
	declare addAddresses: HasManyAddAssociationsMixin<Address, string>;
	declare createAddress: HasManyCreateAssociationMixin<Address>;
	declare removeAddress: HasManyRemoveAssociationMixin<Address, string>;
	declare removeAddresses: HasManyRemoveAssociationsMixin<Address, string>;
	declare hasAddress: HasManyHasAssociationMixin<Address, string>;
	declare hasAddresses: HasManyHasAssociationsMixin<Address, string>;
	declare countAddresses: HasManyCountAssociationsMixin;

	declare static associations: {
		activeOrder: Association<User, Order>;
		orders: Association<User, Order>;
		addresses: Association<User, Address>;
	};

	static initModel(sequelize: Sequelize): typeof User {
		User.init(
			{
				id: {
					type: DataTypes.UUID,
					primaryKey: true,
					allowNull: false,
					unique: true,
					defaultValue: DataTypes.UUIDV4
				},
				username: {
					type: DataTypes.STRING,
					// unique: true, // can be uncommented after we switch from mssql
					allowNull: true,
					validate: {
						isString: validateStringField('Username')
					}
				},
				email: {
					type: DataTypes.STRING,
					// unique: true, // can be uncommented after we switch from mssql
					allowNull: true,
					validate: {
						isEmail: {
							msg: 'Email is not valid'
						}
					}
				},
				passwordHash: {
					type: DataTypes.STRING,
					allowNull: true
				},
				role: {
					type: DataTypes.STRING,
					allowNull: false,
					validate: {
						isIn: [userRoles]
					},
					defaultValue: UserRole.guest
				},
				createdAt: {
					type: DataTypes.DATE
				},
				updatedAt: {
					type: DataTypes.DATE
				}
			},
			{
				sequelize
			}
		);

		return User;
	}

	static associate() {
		// User has no deps

		User.hasMany(Order, {
			foreignKey: 'userId',
			as: 'orders'
		});

		User.hasMany(Address, {
			foreignKey: 'userId',
			as: 'addresses'
		});
	}

	public async data(dto: boolean = true): Promise<UserInterface> {
		const fields = [
			'id',
			'role',
			'username',
			'email',
			'createdAt',
			'updatedAt'
		];

		const base_data = fields.reduce((acc, field) => {
			return {
				...acc,
				[field]: this[field as keyof User]
			};
		}, {}) as UserBaseInterface;

		const [orders, activeOrder, addresses] = await Promise.all([
			fetchMultiData<OrderInterface, Order>(
				() => this.getOrders({ order: [['createdAt', 'DESC']] }),
				dto
			),
			fetchSingleData<OrderInterface, Order>(() => this.getActiveOrder(), dto),
			fetchMultiData<AddressInterface, Address>(() => this.getAddresses(), dto)
		]);

		const associated_data: UserAssociationsInterface = {
			orders,
			activeOrder,
			addresses
		};

		return {
			...base_data,

			...associated_data
		};
	}

	public getHash(): string {
		return this.passwordHash;
	}

	public isSuperUser() {
		return this.role === UserRole.admin || this.role === UserRole.owner;
	}

	public isOwner() {
		return this.role === UserRole.owner;
	}

	public async getActiveOrder(): Promise<Order | null> {
		const activeOrder = await this.getOrders({
			where: {
				status: OrderStatus.draft
			},
			order: [['createdAt', 'DESC']]
		});

		return activeOrder[0] ?? null;
	}
}
