const Sequelize = require("sequelize");

/**
 * Actions summary:
 *
 * addColumn(thumbnailId) => "Products"
 * changeColumn(imageId) => "ProductImages"
 *
 */

const info = {
  revision: 10,
  name: "noname",
  created: "2025-02-08T18:01:32.963Z",
  comment: "",
};

const migrationCommands = (transaction) => [
  {
    fn: "addColumn",
    params: [
      "Products",
      "thumbnailId",
      {
        type: Sequelize.UUID,
        field: "thumbnailId",
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
        references: { model: "Images", key: "id" },
        allowNull: true,
      },
      { transaction },
    ],
  },
  {
    fn: "changeColumn",
    params: [
      "ProductImages",
      "imageId",
      {
        type: Sequelize.UUID,
        field: "imageId",
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
        references: { model: "Images", key: "id" },
        allowNull: true,
      },
      { transaction },
    ],
  },
];

const rollbackCommands = (transaction) => [
  {
    fn: "removeColumn",
    params: ["Products", "thumbnailId", { transaction }],
  },
  {
    fn: "changeColumn",
    params: [
      "ProductImages",
      "imageId",
      {
        type: Sequelize.UUID,
        field: "imageId",
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
        references: { model: "Images", key: "id" },
        allowNull: true,
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
