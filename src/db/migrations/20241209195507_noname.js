const Sequelize = require("sequelize");

/**
 * Actions summary:
 *
 * createTable() => "Discounts", deps: []
 * createTable() => "Users", deps: []
 * createTable() => "Addresses", deps: [Users]
 * createTable() => "Orders", deps: [Discounts, Users]
 * createTable() => "Products", deps: [Discounts]
 * createTable() => "Payments", deps: [Orders]
 * createTable() => "Prices", deps: [Discounts, Payments]
 * createTable() => "OrderItems", deps: [Orders, Products]
 * createTable() => "ProductPrices", deps: [Prices, Products]
 * createTable() => "OrderAddress", deps: [Addresses, Orders]
 *
 */

const info = {
  revision: 1,
  name: "noname",
  created: "2024-12-09T19:55:07.407Z",
  comment: "",
};

const migrationCommands = (transaction) => [
  {
    fn: "createTable",
    params: [
      "Discounts",
      {
        id: {
          type: Sequelize.UUID,
          field: "id",
          defaultValue: Sequelize.UUIDV4,
          unique: true,
          allowNull: false,
          primaryKey: true,
        },
        type: {
          type: Sequelize.STRING,
          field: "type",
          defaultValue: "fixed",
          allowNull: false,
        },
        value: { type: Sequelize.INTEGER, field: "value", allowNull: true },
        createdAt: { type: Sequelize.DATE, field: "createdAt" },
        updatedAt: { type: Sequelize.DATE, field: "updatedAt" },
        deletedAt: {
          type: Sequelize.DATE,
          field: "deletedAt",
          allowNull: true,
        },
      },
      { transaction },
    ],
  },
  {
    fn: "createTable",
    params: [
      "Users",
      {
        id: {
          type: Sequelize.UUID,
          field: "id",
          defaultValue: Sequelize.UUIDV4,
          unique: true,
          allowNull: false,
          primaryKey: true,
        },
        username: {
          type: Sequelize.STRING,
          field: "username",
          allowNull: true,
        },
        email: { type: Sequelize.STRING, field: "email", allowNull: true },
        passwordHash: {
          type: Sequelize.STRING,
          field: "passwordHash",
          allowNull: true,
        },
        role: {
          type: Sequelize.STRING,
          field: "role",
          defaultValue: "guest",
          allowNull: false,
        },
        createdAt: { type: Sequelize.DATE, field: "createdAt" },
        updatedAt: { type: Sequelize.DATE, field: "updatedAt" },
      },
      { transaction },
    ],
  },
  {
    fn: "createTable",
    params: [
      "Addresses",
      {
        id: {
          type: Sequelize.UUID,
          field: "id",
          defaultValue: Sequelize.UUIDV4,
          unique: true,
          allowNull: false,
          primaryKey: true,
        },
        type: {
          type: Sequelize.STRING,
          field: "type",
          defaultValue: "billing",
          allowNull: false,
        },
        name: { type: Sequelize.STRING, field: "name" },
        surname: { type: Sequelize.STRING, field: "surname", defaultValue: "" },
        email: { type: Sequelize.STRING, field: "email", defaultValue: "" },
        phone: { type: Sequelize.STRING, field: "phone", defaultValue: "" },
        addressLine1: { type: Sequelize.STRING, field: "addressLine1" },
        addressLine2: {
          type: Sequelize.STRING,
          field: "addressLine2",
          allowNull: true,
        },
        country: { type: Sequelize.STRING, field: "country" },
        city: { type: Sequelize.STRING, field: "city" },
        postalCode: { type: Sequelize.STRING, field: "postalCode" },
        createdAt: { type: Sequelize.DATE, field: "createdAt" },
        updatedAt: { type: Sequelize.DATE, field: "updatedAt" },
        deletedAt: {
          type: Sequelize.DATE,
          field: "deletedAt",
          allowNull: true,
        },
        userId: {
          type: Sequelize.UUID,
          field: "userId",
          onUpdate: "CASCADE",
          onDelete: "CASCADE",
          references: { model: "Users", key: "id" },
          allowNull: true,
        },
      },
      { transaction },
    ],
  },
  {
    fn: "createTable",
    params: [
      "Orders",
      {
        id: {
          type: Sequelize.UUID,
          field: "id",
          defaultValue: Sequelize.UUIDV4,
          unique: true,
          allowNull: false,
          primaryKey: true,
        },
        status: {
          type: Sequelize.STRING,
          field: "status",
          defaultValue: "draft",
          allowNull: false,
        },
        createdAt: { type: Sequelize.DATE, field: "createdAt" },
        updatedAt: { type: Sequelize.DATE, field: "updatedAt" },
        deletedAt: {
          type: Sequelize.DATE,
          field: "deletedAt",
          allowNull: true,
        },
        discountId: {
          type: Sequelize.UUID,
          field: "discountId",
          onUpdate: "CASCADE",
          onDelete: "SET NULL",
          references: { model: "Discounts", key: "id" },
          allowNull: true,
        },
        userId: {
          type: Sequelize.UUID,
          field: "userId",
          onUpdate: "CASCADE",
          onDelete: "SET NULL",
          references: { model: "Users", key: "id" },
          allowNull: true,
        },
      },
      { transaction },
    ],
  },
  {
    fn: "createTable",
    params: [
      "Products",
      {
        id: {
          type: Sequelize.UUID,
          field: "id",
          defaultValue: Sequelize.UUIDV4,
          unique: true,
          allowNull: false,
          primaryKey: true,
        },
        name: { type: Sequelize.STRING, field: "name", defaultValue: "" },
        description: {
          type: Sequelize.STRING,
          field: "description",
          defaultValue: "",
        },
        stock: { type: Sequelize.INTEGER, field: "stock", defaultValue: 1 },
        thumbnailUrl: {
          type: Sequelize.STRING,
          field: "thumbnailUrl",
          defaultValue: "",
        },
        imageUrls: {
          type: Sequelize.JSON,
          field: "imageUrls",
          defaultValue: Sequelize.Array,
        },
        type: {
          type: Sequelize.STRING,
          field: "type",
          defaultValue: "drawing",
          allowNull: false,
        },
        createdAt: { type: Sequelize.DATE, field: "createdAt" },
        updatedAt: { type: Sequelize.DATE, field: "updatedAt" },
        deletedAt: {
          type: Sequelize.DATE,
          field: "deletedAt",
          allowNull: true,
        },
        discountId: {
          type: Sequelize.UUID,
          field: "discountId",
          onUpdate: "CASCADE",
          onDelete: "SET NULL",
          references: { model: "Discounts", key: "id" },
          allowNull: true,
        },
      },
      { transaction },
    ],
  },
  {
    fn: "createTable",
    params: [
      "Payments",
      {
        id: {
          type: Sequelize.UUID,
          field: "id",
          defaultValue: Sequelize.UUIDV4,
          unique: true,
          allowNull: false,
          primaryKey: true,
        },
        stripeId: {
          type: Sequelize.STRING,
          field: "stripeId",
          allowNull: true,
        },
        createdAt: { type: Sequelize.DATE, field: "createdAt" },
        updatedAt: { type: Sequelize.DATE, field: "updatedAt" },
        deletedAt: {
          type: Sequelize.DATE,
          field: "deletedAt",
          allowNull: true,
        },
        orderId: {
          type: Sequelize.UUID,
          field: "orderId",
          onUpdate: "CASCADE",
          onDelete: "SET NULL",
          references: { model: "Orders", key: "id" },
          name: "orderId",
          allowNull: true,
        },
      },
      { transaction },
    ],
  },
  {
    fn: "createTable",
    params: [
      "Prices",
      {
        id: {
          type: Sequelize.UUID,
          field: "id",
          defaultValue: Sequelize.UUIDV4,
          unique: true,
          allowNull: false,
          primaryKey: true,
        },
        price: { type: Sequelize.INTEGER, field: "price", defaultValue: 0 },
        tax: { type: Sequelize.FLOAT, field: "tax", defaultValue: 0 },
        priceableType: {
          type: Sequelize.STRING,
          field: "priceableType",
          allowNull: false,
        },
        createdAt: { type: Sequelize.DATE, field: "createdAt" },
        updatedAt: { type: Sequelize.DATE, field: "updatedAt" },
        deletedAt: {
          type: Sequelize.DATE,
          field: "deletedAt",
          allowNull: true,
        },
        discountId: {
          type: Sequelize.UUID,
          field: "discountId",
          onUpdate: "CASCADE",
          onDelete: "SET NULL",
          references: { model: "Discounts", key: "id" },
          allowNull: true,
        },
        paymentId: {
          type: Sequelize.UUID,
          field: "paymentId",
          onUpdate: "CASCADE",
          onDelete: "SET NULL",
          references: { model: "Payments", key: "id" },
          allowNull: true,
        },
      },
      { transaction },
    ],
  },
  {
    fn: "createTable",
    params: [
      "OrderItems",
      {
        id: {
          type: Sequelize.UUID,
          field: "id",
          defaultValue: Sequelize.UUIDV4,
          unique: true,
          allowNull: false,
          primaryKey: true,
        },
        quantity: {
          type: Sequelize.INTEGER,
          field: "quantity",
          defaultValue: 1,
        },
        createdAt: { type: Sequelize.DATE, field: "createdAt" },
        updatedAt: { type: Sequelize.DATE, field: "updatedAt" },
        deletedAt: {
          type: Sequelize.DATE,
          field: "deletedAt",
          allowNull: true,
        },
        orderId: {
          type: Sequelize.UUID,
          field: "orderId",
          onUpdate: "CASCADE",
          onDelete: "CASCADE",
          references: { model: "Orders", key: "id" },
          allowNull: true,
        },
        productId: {
          type: Sequelize.UUID,
          field: "productId",
          onUpdate: "CASCADE",
          onDelete: "CASCADE",
          references: { model: "Products", key: "id" },
          allowNull: true,
        },
      },
      { transaction },
    ],
  },
  {
    fn: "createTable",
    params: [
      "ProductPrices",
      {
        id: {
          type: Sequelize.UUID,
          field: "id",
          defaultValue: Sequelize.UUIDV4,
          unique: true,
          allowNull: false,
          primaryKey: true,
        },
        isActive: {
          type: Sequelize.BOOLEAN,
          field: "isActive",
          defaultValue: false,
          allowNull: false,
        },
        createdAt: { type: Sequelize.DATE, field: "createdAt" },
        updatedAt: { type: Sequelize.DATE, field: "updatedAt" },
        deletedAt: {
          type: Sequelize.DATE,
          field: "deletedAt",
          allowNull: true,
        },
        priceId: {
          type: Sequelize.UUID,
          field: "priceId",
          onUpdate: "CASCADE",
          onDelete: "SET NULL",
          references: { model: "Prices", key: "id" },
          allowNull: true,
        },
        productId: {
          type: Sequelize.UUID,
          field: "productId",
          onUpdate: "CASCADE",
          onDelete: "CASCADE",
          references: { model: "Products", key: "id" },
          allowNull: true,
        },
      },
      { transaction },
    ],
  },
  {
    fn: "createTable",
    params: [
      "OrderAddress",
      {
        createdAt: {
          type: Sequelize.DATE,
          field: "createdAt",
          allowNull: false,
        },
        updatedAt: {
          type: Sequelize.DATE,
          field: "updatedAt",
          allowNull: false,
        },
        AddressId: {
          type: Sequelize.UUID,
          field: "AddressId",
          onUpdate: "CASCADE",
          onDelete: "CASCADE",
          references: { model: "Addresses", key: "id" },
          primaryKey: true,
        },
        OrderId: {
          type: Sequelize.UUID,
          field: "OrderId",
          onUpdate: "CASCADE",
          onDelete: "CASCADE",
          references: { model: "Orders", key: "id" },
          primaryKey: true,
        },
      },
      { transaction },
    ],
  },
];

const rollbackCommands = (transaction) => [
  {
    fn: "dropTable",
    params: ["Addresses", { transaction }],
  },
  {
    fn: "dropTable",
    params: ["Discounts", { transaction }],
  },
  {
    fn: "dropTable",
    params: ["Orders", { transaction }],
  },
  {
    fn: "dropTable",
    params: ["OrderItems", { transaction }],
  },
  {
    fn: "dropTable",
    params: ["Payments", { transaction }],
  },
  {
    fn: "dropTable",
    params: ["Prices", { transaction }],
  },
  {
    fn: "dropTable",
    params: ["Products", { transaction }],
  },
  {
    fn: "dropTable",
    params: ["ProductPrices", { transaction }],
  },
  {
    fn: "dropTable",
    params: ["Users", { transaction }],
  },
  {
    fn: "dropTable",
    params: ["OrderAddress", { transaction }],
  },
];

const pos = 0;
const useTransaction = true;

const execute = (queryInterface, sequelize, _commands) => {
  let index = pos;
  const run = (transaction) => {
    const commands = _commands(transaction);
    return new Promise((resolve, reject) => {
      const next = () => {
        if (index < commands.length) {
          const command = commands[index];
          console.log(`[#${index}] execute: ${command.fn}`);
          index++;
          queryInterface[command.fn](...command.params).then(next, reject);
        } else resolve();
      };
      next();
    });
  };
  if (useTransaction) return queryInterface.sequelize.transaction(run);
  return run(null);
};

module.exports = {
  pos,
  useTransaction,
  up: (queryInterface, sequelize) =>
    execute(queryInterface, sequelize, migrationCommands),
  down: (queryInterface, sequelize) =>
    execute(queryInterface, sequelize, rollbackCommands),
  info,
};
