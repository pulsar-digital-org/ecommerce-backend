const Sequelize = require("sequelize");

/**
 * Actions summary:
 *
 * removeColumn(type) => "Products"
 * createTable() => "Categories", deps: []
 * createTable() => "ProductCategory", deps: [Categories, Products]
 *
 */

const info = {
  revision: 2,
  name: "noname",
  created: "2024-12-11T19:50:01.111Z",
  comment: "",
};

const migrationCommands = (transaction) => [
  {
    fn: "removeColumn",
    params: ["Products", "type", { transaction }],
  },
  {
    fn: "createTable",
    params: [
      "Categories",
      {
        id: {
          type: Sequelize.UUID,
          field: "id",
          defaultValue: Sequelize.UUIDV4,
          unique: true,
          allowNull: false,
          primaryKey: true,
        },
        name: { type: Sequelize.STRING, field: "name", allowNull: false },
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
      "ProductCategory",
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
        CategoryId: {
          type: Sequelize.UUID,
          field: "CategoryId",
          onUpdate: "CASCADE",
          onDelete: "CASCADE",
          references: { model: "Categories", key: "id" },
          primaryKey: true,
        },
        ProductId: {
          type: Sequelize.UUID,
          field: "ProductId",
          onUpdate: "CASCADE",
          onDelete: "CASCADE",
          references: { model: "Products", key: "id" },
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
    params: ["Categories", { transaction }],
  },
  {
    fn: "dropTable",
    params: ["ProductCategory", { transaction }],
  },
  {
    fn: "addColumn",
    params: [
      "Products",
      "type",
      {
        type: Sequelize.STRING,
        field: "type",
        defaultValue: "drawing",
        allowNull: false,
      },
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
