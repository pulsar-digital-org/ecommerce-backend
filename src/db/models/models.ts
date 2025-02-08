import { Sequelize } from 'sequelize';
import { User } from './User';
import { Order } from './Order';
import { Price } from './Price';
import { Product } from './Product';
import { OrderItem } from './OrderItem';
import { Address } from './Address';
import { ProductPrice } from './ProductPrice';
import { Discount } from './Discount';
import { Payment } from './Payment';
import { Category } from './Category';
import { Image } from './Image';
import { ProductImage } from './ProductImage';

export interface BaseModelInterface<TInterface> {
	data(dto: boolean): Promise<TInterface>;
	id: string;
}

export function initModels(sequelize: Sequelize) {
	Address.initModel(sequelize);
	Discount.initModel(sequelize);
	Order.initModel(sequelize);
	OrderItem.initModel(sequelize);
	Payment.initModel(sequelize);
	Price.initModel(sequelize);
	Product.initModel(sequelize);
	ProductPrice.initModel(sequelize);
	User.initModel(sequelize);
	Category.initModel(sequelize);
	Image.initModel(sequelize);
	ProductImage.initModel(sequelize);

	Address.associate();
	Discount.associate();
	Order.associate();
	OrderItem.associate();
	Payment.associate();
	Price.associate();
	Product.associate();
	ProductPrice.associate();
	User.associate();
	Category.associate();
	Image.associate();
	ProductImage.associate();

	return {
		Address,
		Discount,
		Order,
		OrderItem,
		Payment,
		Price,
		Product,
		ProductPrice,
		User,
		Category,
		Image,
		ProductImage,
	};
}
