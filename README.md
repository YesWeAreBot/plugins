# @yesimbot/plugins

> Plugins for YesImBot, a chatbot framework based on Koishi.

## Available Plugins

- [@yesimbot/plugin-code-executor](./packages/plugin-code-executor)
- [@yesimbot/plugin-daily-planner](./packages/plugin-daily-planner)
- [@yesimbot/plugin-favor](./packages/plugin-favor)
- [@yesimbot/plugin-mcp](./packages/plugin-mcp)
- [@yesimbot/plugin-memory-card](./packages/plugin-memory-card)
- [@yesimbot/plugin-pglite](./packages/plugin-pglite)
- [@yesimbot/plugin-sticker-manager](./packages/plugin-sticker-manager)
- [@yesimbot/plugin-tts](./packages/plugin-tts)
- [@yesimbot/plugin-vector-store](./packages/plugin-vector-store)

## Installation

To install a plugin, use npm or yarn. For example, to install the admin plugin, run:

```bash
npm install @yesimbot/plugin-mcp
# or
yarn add @yesimbot/plugin-mcp
```

## Usage

After installing a plugin, you need to register it in your YesImBot application. For example, to use the admin plugin, add the following code to your bot setup:

```javascript
const { AdminPlugin } = require('@yesimbot/plugin-admin');
bot.use(AdminPlugin);
```

Refer to each plugin's documentation for specific configuration options and usage instructions.

## Contributing

Contributions are welcome! If you want to contribute to the development of these plugins, please fork the repository, make your changes, and submit a pull request.

## License

This project is licensed under the MIT License. See the [LICENSE](./LICENSE) file for details.
