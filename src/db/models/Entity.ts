import {
	CreationOptional,
	DataTypes,
	InferCreationAttributes,
	InferAttributes,
	Model,
	Sequelize,
} from 'sequelize'
import { validateStringField } from '../helper'
import { BaseModelInterface } from './models'
import { EntityType, entityTypes } from '../types'

interface EntityBaseInterface extends BaseModelInterface {
	type: EntityType

	name: string
	email: string
	phone?: string

	orgId?: string
	taxId?: string
	vatId?: string
}

interface EntityAssociationsInterface {}

export interface EntityInterface
	extends EntityBaseInterface,
		EntityAssociationsInterface {}

type EntityAssociations = ''

export class Entity extends Model<
	InferAttributes<Entity, { omit: EntityAssociations }>,
	InferCreationAttributes<Entity, { omit: EntityAssociations }>
> {
	declare id: CreationOptional<string>

	declare type: CreationOptional<EntityType>

	declare name: string
	declare email: string
	declare phone?: string

	declare orgId?: string
	declare taxId?: string
	declare vatId?: string

	declare createdAt: CreationOptional<Date>
	declare updatedAt: CreationOptional<Date>
	declare deletedAt: CreationOptional<Date>

	declare static associations: {}

	static initModel(sequelize: Sequelize): typeof Entity {
		Entity.init(
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
						isIn: [entityTypes],
					},
					defaultValue: EntityType.individual,
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
				email: {
					type: DataTypes.STRING,
					validate: {
						isEmail: {
							msg: 'Email is not valid',
						},
					},
				},
				phone: {
					type: DataTypes.STRING,
					defaultValue: '',
					validate: {
						isString: validateStringField('phone'),
						len: {
							args: [0, 128],
							msg: 'Phone max length is 128 characters',
						},
					},
				},
				orgId: {
					type: DataTypes.STRING,
					validate: {
						isString: validateStringField('orgId'),
						len: {
							args: [0, 128],
							msg: 'OrgId max length is 128 characters',
						},
					},
				},
				taxId: {
					type: DataTypes.STRING,
					validate: {
						isString: validateStringField('taxId'),
						len: {
							args: [0, 128],
							msg: 'OrgId max length is 128 characters',
						},
					},
				},
				vatId: {
					type: DataTypes.STRING,
					validate: {
						isString: validateStringField('vatId'),
						len: {
							args: [0, 128],
							msg: 'OrgId max length is 128 characters',
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
				// check when we have bussiness that we provided the required organization values
			}
		)

		return Entity
	}

	static associate() {}

	public async data(): Promise<EntityInterface> {
		const fields = [
			'id',
			'type',
			'name',
			'email',
			'phone',
			'orgId',
			'taxId',
			'vatId',
			'createdAt',
			'updatedAt',
			...(this.deletedAt ? ['deletedAt'] : []),
		]

		const base_data = fields.reduce((acc, field) => {
			return {
				...acc,
				[field]: this[field as keyof Entity],
			}
		}, {}) as EntityBaseInterface

		const associated_data: EntityAssociationsInterface = {}

		return {
			...base_data,

			...associated_data,
		}
	}
}
