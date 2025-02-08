import { HTTPException } from 'hono/http-exception';

/**
 * Status code 400
 */
class BadRequestError extends HTTPException {
	constructor(message = '') {
		super(401, { message });
		this.name = 'BadRequestError';
	}
}

/**
 * Status code 401
 */
class UnauthorizedError extends HTTPException {
	constructor(message = '') {
		super(401, { message });
		this.name = 'UnauthorizedError';
	}
}

/**
 * Status code 403
 */
class AlreadyExistsError extends HTTPException {
	constructor(message = '') {
		super(403, { message });
		this.name = 'AlreadyExistsError';
	}
}

/**
 * Status code 403
 */
class ForbiddenError extends HTTPException {
	constructor(message = '') {
		super(403, { message });
		this.name = 'ForbiddenError';
	}
}

/**
 * Status code 404
 */
class NotFoundError extends HTTPException {
	constructor(message = '') {
		super(404, { message });
		this.name = 'NotFoundError';
	}
}

/**
 * Status code 401
 */
class WrongCredentialsError extends HTTPException {
	constructor(message = '') {
		super(401, { message });
		this.name = 'WrongCredentialsError';
	}
}

/**
 * Status code 429
 */
class TooManyRequestsError extends HTTPException {
	retryAfter: number;
	constructor(message = '', retryAfter = 2) {
		super(429, { message });
		this.name = 'TooManyRequestsError';
		this.retryAfter = retryAfter;
	}
}

/**
 * Status code 503
 */
class NotAvailableError extends HTTPException {
	constructor(message = '') {
		super(503, { message });
		this.name = 'NotAvailableError';
	}
}

export {
	BadRequestError,
	UnauthorizedError,
	AlreadyExistsError,
	ForbiddenError,
	NotFoundError,
	WrongCredentialsError,
	TooManyRequestsError,
	NotAvailableError
};
