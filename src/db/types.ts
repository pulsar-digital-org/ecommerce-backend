export enum OrderStatus {
	draft = 'draft',
	pending = 'pending',
	paid = 'paid',
	shipped = 'shipped',
	delivered = 'delivered',
	cancelled = 'cancelled',
	refunded = 'refunded',
}

export enum UserRole {
	owner = 'owner',
	admin = 'admin',
	user = 'user',
	guest = 'guest',
}

export enum EntityType {
	individual = 'individual',
	business = 'business',
}

export enum DiscountType {
	percentage = 'percentage',
	fixed = 'fixed',
}

export const orderStatuses: string[] = Object.values(OrderStatus).filter(
	(value) => typeof value === 'string'
) as string[]

export const userRoles: string[] = Object.values(UserRole).filter(
	(value) => typeof value === 'string'
) as string[]

export const entityTypes: string[] = Object.values(EntityType).filter(
	(value) => typeof value === 'string'
) as string[]

export const discountTypes: string[] = Object.values(DiscountType).filter(
	(value) => typeof value === 'string'
) as string[]
