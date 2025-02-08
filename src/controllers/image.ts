import { randomUUID } from 'crypto';
import { BadRequestError, NotFoundError } from '../errors';
import * as Minio from 'minio';
import db from '../db/db';
import { Transaction } from 'sequelize';
import { Image } from '../db/models/Image';
import { User } from '../db/models/User';

const imageCreate = async (
	image: string, // base64 encoded string
	user: User
) => {
	// Extract Base64 data
	const matches = image.match(/^data:(.+);base64,(.+)$/);
	if (!matches || matches.length !== 3) {
		throw new BadRequestError(
			'Invalid image format. Expected Base64-encoded string.'
		);
	}

	const mimeType = matches[1];
	const base64Data = matches[2];

	// Validate MIME type (optional)
	const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif'];
	if (!allowedMimeTypes.includes(mimeType)) {
		throw new BadRequestError('Unsupported image type.');
	}

	// Decode Base64 data
	const buffer = Buffer.from(base64Data, 'base64');

	// Generate a unique filename
	const extension = mimeType.split('/')[1];
	const filename = `${randomUUID()}.${extension}`;

	const minioClient = new Minio.Client({
		endPoint: process.env.BUCKET_URL || '',
		useSSL: true,
		accessKey: process.env.BUCKET_ACCESSKEY || '',
		secretKey: process.env.BUCKET_SECRETKEY || '',
	});

	const bucket = process.env.BUCKET_NAME || 'default';

	const exists = await minioClient.bucketExists(
		process.env.BUCKET_NAME || 'default'
	);
	if (!exists) {
		await minioClient.makeBucket(process.env.BUCKET_NAME || 'default');
		console.log('Created new bucket');
	}

	const uploaded = await minioClient.putObject(
		bucket,
		filename,
		buffer,
		buffer.length
	);

	const created_image = await db.transaction(async (t: Transaction) => {
		const image = await Image.create(
			{
				url:
					'https://' +
					process.env.BUCKET_URL +
					'/' +
					process.env.BUCKET_NAME +
					'/' +
					filename,
				name: uploaded.etag,
			},
			{ transaction: t }
		);
		await image.setUser(user, { transaction: t });

		return image;
	});

	return created_image.data();
};

async function imageGet(
	imageId: string,
	options?: { transaction: Transaction }
) {
	let image: Image | null;
	try {
		image = await Image.findOne({
			where: {
				id: imageId,
			},
			paranoid: false,
			...options,
		});
	} catch (err) {
		throw new NotFoundError("Couldn't find image");
	}
	if (!image) {
		throw new NotFoundError("Couldn't find image");
	}

	return image;
}

// todo: add deletion from bucket to hooks in Model
async function imageDelete(image: Image, force: boolean = false) {
	await image.delete({ force });
}

export { imageCreate, imageGet, imageDelete };
