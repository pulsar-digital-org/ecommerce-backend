import { randomUUID } from 'crypto'
import { BadRequestError, NotFoundError } from '../errors'
import * as Minio from 'minio'
import db from '../db/db'
import { Transaction } from 'sequelize'
import { Image } from '../db/models/Image'
import { User } from '../db/models/User'
import * as sharp from 'sharp'

const imageCreate = async (image: Blob, user: User) => {
	const mimeType = image.type
	console.log('Original mime type:', mimeType)

	const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif']
	if (!allowedMimeTypes.includes(mimeType)) {
		throw new BadRequestError('Unsupported image type.')
	}

	const arrayBuffer = await image.arrayBuffer()
	const buffer = Buffer.from(arrayBuffer)

	let processedBuffer: Buffer
	let finalMimeType = mimeType

	if (mimeType === 'image/jpeg') {
		processedBuffer = await sharp(buffer).jpeg({ quality: 80 }).toBuffer()
	} else if (mimeType === 'image/png') {
		processedBuffer = await sharp(buffer).png({ quality: 80 }).toBuffer()
	} else if (mimeType === 'image/gif') {
		processedBuffer = await sharp(buffer).png({ quality: 80 }).toBuffer()
		finalMimeType = 'image/png'
	} else {
		throw new BadRequestError('Unsupported image type.')
	}

	const extension = finalMimeType.split('/')[1]
	const filename = `${randomUUID()}.${extension}`

	const minioClient = new Minio.Client({
		endPoint: process.env.BUCKET_URL || '',
		useSSL: true,
		accessKey: process.env.BUCKET_ACCESSKEY || '',
		secretKey: process.env.BUCKET_SECRETKEY || '',
	})

	const bucket = process.env.BUCKET_NAME || 'default'

	const exists = await minioClient.bucketExists(bucket)
	if (!exists) {
		await minioClient.makeBucket(bucket)
		console.log('Created new bucket')
	}

	const uploaded = await minioClient.putObject(
		bucket,
		filename,
		processedBuffer,
		processedBuffer.length
	)

	const created_image = await db.transaction(async (t: Transaction) => {
		const imageRecord = await Image.create(
			{
				url:
					'https://' +
					process.env.BUCKET_URL +
					'/' +
					process.env.BUCKET_NAME +
					'/' +
					filename,
				name: uploaded.etag,
				size: processedBuffer.length,
			},
			{ transaction: t }
		)
		await imageRecord.setUser(user, { transaction: t })
		return imageRecord
	})

	return created_image.data()
}

async function imageGet(
	imageId: string,
	options?: { transaction: Transaction }
) {
	const image = await Image.findByPk(imageId, options)
	if (!image) {
		throw new NotFoundError("Couldn't find image")
	}

	return image
}

async function removeImageFromBucket(image: Image): Promise<void> {
	const minioClient = new Minio.Client({
		endPoint: process.env.BUCKET_URL || '',
		useSSL: true,
		accessKey: process.env.BUCKET_ACCESSKEY || '',
		secretKey: process.env.BUCKET_SECRETKEY || '',
	})

	const bucket = process.env.BUCKET_NAME || 'default'
	const filename = image.url.split('/').pop()

	if (filename) {
		await minioClient.removeObject(bucket, filename)
		console.log('Image removed from bucket:', filename)
	} else {
		throw new Error('Invalid image URL')
	}
}

// todo: add deletion from bucket to hooks in Model
async function imageDelete(image: Image, force: boolean = false) {
	await image.delete()
}

export { imageCreate, imageGet, removeImageFromBucket, imageDelete }
