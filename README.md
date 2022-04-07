# League Dependency Graph
### Confluence Macro


This project contains a confluence macro that reads the first table in a confluence page and uses it to display a graph. 
The table must follow the following format:
```
|--------|--------|-------------|----------|
|  Name  |   ID   | Description | Targets  |
|--------|--------|-------------|----------|
| String | String |   String    | - String |
|        |        |             | - String |
|        |        |             | - ...    |
|--------|--------|-------------|----------| 
```

See [developer.atlassian.com/platform/forge/](https://developer.atlassian.com/platform/forge) for documentation and tutorials explaining how to make confluence macros.

## Requirements

See [Set up Forge](https://developer.atlassian.com/platform/forge/set-up-forge/) for instructions to get set up.

## Quick start

### Build CustomUI (graph)
**Needed before deploying using `forge`**
- Navigate to the `./static/league-graph` folder
- Initialize dependencies
```
npm install
```

- Build:
```
npm run-script build
```

### Develop CustomUI (graph) locally
- Navigate to the `./static/league-graph` folder and run:
```
npm run-script develop
```

### Deploy to confluence

- Modify your app by editing the `src/index.tsx` file.

- Build and deploy your app by running:
```
forge deploy
```

- Install your app in an Atlassian site by running:
```
forge install
```

- Develop your app by running `forge tunnel` to proxy invocations locally:
```
forge tunnel
```

### Notes
- Use the `forge deploy` command when you want to persist code changes.
- Use the `forge install` command when you want to install the app on a new site.
- Once the app is installed on a site, the site picks up the new app changes you deploy without needing to rerun the install command.

## Support

See [Get help](https://developer.atlassian.com/platform/forge/get-help/) for how to get help and provide feedback.
