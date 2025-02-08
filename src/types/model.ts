import { Model } from 'sequelize';
import { Category } from '../db/models/Category';
import { Image } from '../db/models/Image';
import { Product } from '../db/models/Product';
import { User } from '../db/models/User';

export type WithoutModel<T> = Omit<T, keyof Model>
export type NonFunctionPropertyNames<T> = { [K in keyof T]: T[K] extends Function ? never : K }[keyof T];
export type NonFunctionProperties<T> = Pick<T, NonFunctionPropertyNames<T>>

export type UserType = NonFunctionProperties<WithoutModel<User>>;
export type CategoryType = NonFunctionProperties<WithoutModel<Category>>;
export type ImageType = WithoutModel<Image>;
export type ProductType = NonFunctionProperties<WithoutModel<Product>>;
