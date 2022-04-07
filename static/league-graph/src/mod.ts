import cytoscape from 'cytoscape';
import cola from 'cytoscape-cola';
import dagre from 'cytoscape-dagre';

async function getGraph() {
    try {
        const bridge = await import('@forge/bridge');
        return await bridge.invoke('getGraph') as any[];
    } catch (e) {
        // to be able to test locally
        return [
            {
                name: 'Legacy FHIR Router',
                code: 'legacy-fhir-router',
                description: 'Version of the FHIR Router used to communicate with a monolithic instance of the Cloud Healthcare API',
                dependencies: [ '' ]
            },

            {
                name: 'FHIR Router**',
                code: 'fhir-router',
                description: 'New version of the FHIR router that enables the use of League FHIR Modules',
                dependencies: [ 'legacy-fhir-router*' ]
            },

            {
                name: 'Health Activity Manager**',
                code: 'ham',
                description: 'Module used to keep track of tasks through the use of observations',
                dependencies: [ 'legacy-fhir-router' ]
            },

            {
                name: 'Health Journey Personalizer',
                code: 'hjp',
                description: 'Module used to personalize user journeys',
                dependencies: [ 'legacy-fhir-router', 'ham' ]
            },

            {
                name: 'Dynamic Campaigns',
                code: 'dyn-campaigns',
                description: 'Module that surfaces dynamic campaigns to users',
                dependencies: [ 'legacy-fhir-router', 'hjp', 'ham' ]
            },

            {
                name: 'Challenges',
                code: 'challenges',
                description: 'Module that starts and manages activity challenges for users and teams',
                dependencies: [ 'legacy-fhir-router', 'hjp', 'ham', 'dyn-campaigns' ]
            }
        ];
    }
}

function hasImplicitDependency(nodeMap, targets, dependency) {
    for (const target of targets) {
        const node = nodeMap.get(target);
        if (node) {
            if (node.deps.has(dependency) || hasImplicitDependency(nodeMap, node.deps, dependency)) {
                return true;
            }
        }
    }
    return false;
}

function graph2elements(graph, simplifyDeps = true) {
    const elements = [];
    const nodeMap = new Map();

    for (const element of graph) {
        const node = element.code.trim();
        nodeMap.set(node, {
            name: element.name,
            deps: new Set(element.dependencies.map(d => d.trim())),
        });
    }

    for (const [node, props] of nodeMap) {
        // node
        elements.push({
            data: {
                id: node,
                name: props.name,
                color: props.name.endsWith('**') ? '#B8D6D8' : '#C4CFFD',
                borderStyle: props.name.endsWith('**') ? 'dashed' : 'solid',
                borderColor: props.name.endsWith('**') ? '#705BA4' : '#200B54',
            }
        });

        // edges
        for (let target of props.deps) {
            if (target && (!simplifyDeps || !hasImplicitDependency(nodeMap, props.deps, target))) {
                let style = 'solid';
                if (target.endsWith('*')) {
                    style = 'dashed';
                    target = target.substr(0, target.length - 1);
                }
                elements.push({
                    data: {
                        id: `${node}-${target}`,
                        source: node,
                        target: target,
                        style,
                    }
                });
            }
        }
    }
    return elements;
}

function createCy(container, elements) {
    const cy = cytoscape({
        container,
        elements,
        style: [ // the stylesheet for the graph
            {
                selector: 'node',
                style: {
                    'background-color': 'data(color)',
                    'border-width': 2,
                    'border-style': 'data(borderStyle)',
                    'border-color': 'data(borderColor)',

                    'label': 'data(name)',
                    'color': '#200B54',
                    'font-weight': 600,
                }
            },
            {
                selector: 'edge',
                style: {
                    'width': 3,
                    'line-color': '#D9D6E5',
                    'line-style': 'data(style)',
                    'target-arrow-color': '#D9D6E5',
                    'target-arrow-shape': 'triangle',
                    'curve-style': 'bezier',
                }
            },
            {
                selector: '.selected',
                style: {
                    'background-color': '#00C29B',
                    'line-color': '#00C29B',
                    'target-arrow-color': '#00C29B',
                }
            },
            {
                selector: '.faded',
                style: {
                    'background-color': '#F0F3FF',
                    'line-color': '#F0F3FF',
                    'target-arrow-color': '#F0F3FF',
                    'color': '#F0F3FF',
                    'border-color': '#F0F3FF',
                }
            }
        ],
        layout: {
            name: 'dagre',
            nodeSep: 200,
            rankSep: 80,
            acyclicer: 'greedy',
            ranker: 'longest-path',
        },
        userZoomingEnabled: false,
    });

    let selection = null;
    cy.on('click', evt => {
        if (selection) {
            selection.removeClass('selected');
            selection.absoluteComplement().removeClass('faded');
            selection = null;
        }

        if (evt.target.group && evt.target.group() === 'nodes') {
            selection = evt.target;
            // selection.union(evt.target);
            selection = selection.union(evt.target.successors());
            selection.addClass('selected');
            selection.absoluteComplement().addClass('faded');
        }
    });

    return cy;
}

async function main() {
    cytoscape.use(cola);
    cytoscape.use(dagre);

    const graph = await getGraph();

    const container = document.getElementById('graph-container'); // container to render in
    container.style.height = '800px'; // meh... when I figure out how to make a config panel, I'll make this configurable

    let cy = createCy(container, graph2elements(graph))

    const checkbox = document.getElementById('simple-deps') as HTMLInputElement;
    checkbox.addEventListener('change', () => {
        cy.destroy();
        cy = createCy(container, graph2elements(graph, checkbox.checked));
    });
}


main();