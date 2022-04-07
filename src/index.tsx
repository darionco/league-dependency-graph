import Resolver from '@forge/resolver';
import api, {route} from "@forge/api";
import { parse } from 'node-html-parser';

const fetchContent = async (contentId) => {
    const res = await api.asApp().requestConfluence(route`/wiki/rest/api/content/${contentId}?expand=body.storage`, {
        headers: {
            'Accept': 'application/json'
        }
    });
    return await res.json();
};


const resolver = new Resolver();

resolver.define('getGraph', async ({payload, context}) => {
    const content = await fetchContent(context.extension.content.id);
    const doc = parse(content.body.storage.value);

    const table = doc.getElementsByTagName('table')[0].getElementsByTagName('tbody')[0];
    const nodes = [];

    // ignore first row as it's the header
    for (let i = 1, n = table.childNodes.length; i < n; ++i) {
        const row = table.childNodes[i] as unknown as HTMLElement;

        const module = {
            name: row.childNodes[0].textContent,
            code: row.childNodes[1].textContent,
            description: row.childNodes[2].textContent,
            dependencies: Array.prototype.map.call((row.childNodes[3] as HTMLElement).getElementsByTagName('p'), p => p.text), // ugh
        };

        nodes.push(module);
    }

    return nodes;
});

export const handler = resolver.getDefinitions();
