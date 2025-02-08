export enum OrderStatus {
	draft = 'draft',
	pending = 'pending',
	paid = 'paid',
	shipped = 'shipped',
	delivered = 'delivered',
	cancelled = 'cancelled'
}

export enum UserRole {
	owner = 'owner',
	admin = 'admin',
	user = 'user',
	guest = 'guest'
}

export enum AddressType {
	billing = 'billing',
	shipping = 'shipping'
}

export enum DiscountType {
	percentage = 'percentage',
	fixed = 'fixed'
}

export enum PriceableType {
	product = 'Product',
	discount = 'Discount',
	payment = 'Payment'
}

export const orderStatuses: string[] = Object.values(OrderStatus).filter(
	value => typeof value === 'string'
) as string[];

export const userRoles: string[] = Object.values(UserRole).filter(
	value => typeof value === 'string'
) as string[];

export const addressTypes: string[] = Object.values(AddressType).filter(
	value => typeof value === 'string'
) as string[];

export const discountTypes: string[] = Object.values(DiscountType).filter(
	value => typeof value === 'string'
) as string[];

export const priceableTypes: string[] = Object.values(PriceableType).filter(
	value => typeof value === 'string'
) as string[];
