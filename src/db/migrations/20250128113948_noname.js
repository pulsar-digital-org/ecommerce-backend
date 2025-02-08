const Sequelize = require("sequelize");

/**
 * Actions summary:
 *
 * removeColumn(imageUrls) => "Products"
 * removeColumn(thumbnailUrl) => "Products"
 * createTable() => "Images", deps: [Users]
 * createTable() => "ProductImages", deps: [Images, Products]
 *
 */

const info = {
  revision: 7,
  name: "noname",
  created: "2025-01-28T11:39:48.092Z",
  comment: "",
};

const migrationCommands = (transaction) => [
  {
    fn: "removeColumn",
    params: ["Products", "imageUrls", { transaction }],
  },
  {
    fn: "removeColumn",
    params: ["Products", "thumbnailUrl", { transaction }],
  },
  {
    fn: "createTable",
    params: [
      "Images",
      {
        id: {
          type: Sequelize.UUID,
          field: "id",
          defaultValue: Sequelize.UUIDV4,
          unique: true,
          allowNull: false,
          primaryKey: true,
        },
        url: { type: Sequelize.STRING, field: "url" },
        active: {
          type: Sequelize.BOOLEAN,
          field: "active",
          defaultValue: true,
        },
        name: { type: Sequelize.STRING, field: "name" },
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
      "ProductImages",
      {
        id: {
          type: Sequelize.UUID,
          field: "id",
          defaultValue: Sequelize.UUIDV4,
          unique: true,
          allowNull: false,
          primaryKey: true,
        },
        isThumbnail: {
          type: Sequelize.BOOLEAN,
          field: "isThumbnail",
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
        imageId: {
          type: Sequelize.UUID,
          field: "imageId",
          onUpdate: "CASCADE",
          onDelete: "SET NULL",
          references: { model: "Images", key: "id" },
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
];

const rollbackCommands = (transaction) => [
  {
    fn: "dropTable",
    params: ["Images", { transaction }],
  },
  {
    fn: "dropTable",
    params: ["ProductImages", { transaction }],
  },
  {
    fn: "addColumn",
    params: [
      "Products",
      "imageUrls",
      {
        type: Sequelize.JSON,
        field: "imageUrls",
        defaultValue: Sequelize.Array,
      },
      { transaction },
    ],
  },
  {
    fn: "addColumn",
    params: [
      "Products",
      "thumbnailUrl",
      { type: Sequelize.STRING, field: "thumbnailUrl", defaultValue: "" },
      { transaction },
    ],
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
