const Sequelize = require("sequelize");

/**
 * Actions summary:
 *
 * addColumn(productId) => "Images"
 *
 */

const info = {
  revision: 2,
  name: "noname",
  created: "2025-02-23T12:45:11.248Z",
  comment: "",
};

const migrationCommands = (transaction) => [
  {
    fn: "addColumn",
    params: [
      "Images",
      "productId",
      {
        type: Sequelize.UUID,
        field: "productId",
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
        references: { model: "Products", key: "id" },
        allowNull: true,
      },
      { transaction },
    ],
  },
];

const rollbackCommands = (transaction) => [
  {
    fn: "removeColumn",
    params: ["Images", "productId", { transaction }],
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
