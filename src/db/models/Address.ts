import {
	Association,
	CreationOptional,
	DataTypes,
	InferCreationAttributes,
	InferAttributes,
	Model,
	NonAttribute,
	Sequelize,
	BelongsToCreateAssociationMixin,
	BelongsToGetAssociationMixin,
	BelongsToSetAssociationMixin,
} from 'sequelize'
import { fetchSingleData, validateStringField } from '../helper'
import { AddressType, addressTypes } from '../types'
import { Entity, EntityInterface } from './Entity'
import { BaseModelInterface } from './models'

interface AddressBaseInterface extends BaseModelInterface {
	type: AddressType

	streetName: string
	streetNumber: string
	postalCode: string
	city: string
	country: string
}

interface AddressAssociationsInterface {
	entity: EntityInterface | string
}

export interface AddressInterface
	extends AddressBaseInterface,
		AddressAssociationsInterface {}

type AddressAssociations = 'entity'

export class Address extends Model<
	InferAttributes<Address, { omit: AddressAssociations }>,
	InferCreationAttributes<Address, { omit: AddressAssociations }>
> {
	declare id: CreationOptional<string>

	declare type: CreationOptional<AddressType>

	declare streetName: string
	declare streetNumber: string
	declare postalCode: string
	declare city: string
	declare country: string

	declare createdAt: CreationOptional<Date>
	declare updatedAt: CreationOptional<Date>
	declare deletedAt: CreationOptional<Date>

	// Address belongsTo Entity
	declare entity?: NonAttribute<Entity>
	declare getEntity: BelongsToGetAssociationMixin<Entity>
	declare setEntity: BelongsToSetAssociationMixin<Entity, string>
	declare createEntity: BelongsToCreateAssociationMixin<Entity>

	declare static associations: {
		entity: Association<Address, Entity>
	}

	static initModel(sequelize: Sequelize): typeof Address {
		Address.init(
			{
				id: {
					type: DataTypes.UUID,
					primaryKey: true,
					allowNull: false,
					unique: true,
					defaultValue: DataTypes.UUIDV4,
				},
				type: {
					type: DataTypes.STRING,
					allowNull: false,
					validate: {
						isIn: [addressTypes],
					},
					defaultValue: AddressType.billing,
				},
				streetName: {
					type: DataTypes.STRING,
					validate: {
						isString: validateStringField('streetName'),
						len: {
							args: [0, 128],
							msg: 'Street name max length is 128 characters',
						},
					},
				},
				streetNumber: {
					type: DataTypes.STRING,
					validate: {
						isString: validateStringField('streetNumber'),
						len: {
							args: [0, 128],
							msg: 'Street number max length is 128 characters',
						},
					},
				},
				country: {
					type: DataTypes.STRING,
					validate: {
						isString: validateStringField('country'),
						len: {
							args: [0, 1024],
							msg: 'Country max length is 1024 characters',
						},
					},
				},
				city: {
					type: DataTypes.STRING,
					validate: {
						isString: validateStringField('city'),
						len: {
							args: [0, 1024],
							msg: 'City Line 2 max length is 1024 characters',
						},
					},
				},
				postalCode: {
					type: DataTypes.STRING,
					validate: {
						isString: validateStringField('postalCode'),
						len: {
							args: [0, 1024],
							msg: 'Postal code max length is 1024 characters',
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

		return Address
	}

	static associate() {
		// Address deps

		Address.belongsTo(Entity, {
			foreignKey: 'entityId',
			onDelete: 'CASCADE',
		})

		// End deps
	}

	public async data(dto: boolean = true): Promise<AddressInterface> {
		const fields = [
			'id',
			'type',
			'streetName',
			'streetNumber',
			'country',
			'city',
			'postalCode',
			'createdAt',
			'updatedAt',
			...(this.deletedAt ? ['deletedAt'] : []),
		]

		const base_data = fields.reduce((acc, field) => {
			return {
				...acc,
				[field]: this[field as keyof Address],
			}
		}, {}) as AddressBaseInterface

		const [entity] = await Promise.all([
			fetchSingleData<any, Entity>(() => this.getEntity(), dto),
		])

		const associated_data: AddressAssociationsInterface = {
			entity,
		}

		return {
			...base_data,

			...associated_data,
		}
	}
}
