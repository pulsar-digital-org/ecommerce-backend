import { BaseModelInterface } from './models/models';

export const validateStringField = (
	fieldName: string
): ((arg: unknown) => void) => {
	return (value: unknown): void => {
		if (value !== null && value !== undefined && typeof value !== 'string') {
			throw new Error(
				`Field '${fieldName}' has '${value}' must be a string or null`
			);
		}
	};
};

export const fetchSingleData = async <
	TInterface,
	TModel extends BaseModelInterface<TInterface>
>(
	association: () => Promise<TModel | null>,
	dto: boolean
): Promise<TInterface | string | undefined> => {
	const result = await association();

	if (!result) {
		return undefined;
	}

	if (dto) {
		return result.data(!dto);
	}

	return result.id;
};

export const fetchMultiData = async <
	TDataInterface,
	TModel extends BaseModelInterface<TDataInterface>
>(
	association: () => Promise<TModel[]>,
	dto: boolean
): Promise<TDataInterface[] | string[]> => {
	const results = await association();

	return Promise.all(
		results.map(async (result) => {
			const data = await fetchSingleData<TDataInterface, TModel>(
				() => Promise.resolve(result),
				dto
			);

			if (data === undefined) {
				throw new Error('Something was not found');
			}

			return data;
		})
	) as Promise<TDataInterface[] | string[]>;
};
