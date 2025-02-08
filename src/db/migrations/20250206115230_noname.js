const Sequelize = require("sequelize");

/**
 * Actions summary:
 *
 * removeColumn(thumbnailUrl) => "Categories"
 * addColumn(imageId) => "Images"
 *
 */

const info = {
  revision: 9,
  name: "noname",
  created: "2025-02-06T11:52:30.948Z",
  comment: "",
};

const migrationCommands = (transaction) => [
  {
    fn: "removeColumn",
    params: ["Categories", "thumbnailUrl", { transaction }],
  },
  {
    fn: "addColumn",
    params: [
      "Images",
      "imageId",
      {
        type: Sequelize.UUID,
        field: "imageId",
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
        references: { model: "Categories", key: "id" },
        allowNull: true,
      },
      { transaction },
    ],
  },
];

const rollbackCommands = (transaction) => [
  {
    fn: "removeColumn",
    params: ["Images", "imageId", { transaction }],
  },
  {
    fn: "addColumn",
    params: [
      "Categories",
      "thumbnailUrl",
      { type: Sequelize.STRING, field: "thumbnailUrl", allowNull: true },
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
