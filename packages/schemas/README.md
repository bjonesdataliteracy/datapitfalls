# @datapitfalls/schemas

Shared data contracts for the datapitfalls family: the shapes that [datapitfalls](https://github.com/bjonesdataliteracy/datapitfalls), [datapitfalls bench](https://github.com/bjonesdataliteracy/datapitfalls-bench) and [datapitfalls agent](https://github.com/bjonesdataliteracy/datapitfalls-agent) exchange.

| Contract | Schema | What it is |
| --- | --- | --- |
| Finding | `schemas/finding.schema.json` | One pitfall a review found |
| Pitfall report | `schemas/pitfall-report.schema.json` | The result of one review |
| Transcript | `schemas/transcript.schema.json` | One session between a person and an AI analytics agent |
| Memory record | `schemas/memory-record.schema.json` | One entry in a datapitfalls agent Logbook |
| Trap | `schemas/trap.schema.json` | A labeled moment in the bench where a pitfall is likely to bite |

JSON Schema 2020-12, with matching TypeScript types:

```ts
import type { Transcript, MemoryRecord } from '@datapitfalls/schemas';
import transcriptSchema from '@datapitfalls/schemas/schemas/transcript.schema.json' with { type: 'json' };
```

Examples of each document live in `examples/`.

**Versioning:** adding an optional field is a minor release; removing or renaming a field is a major release with a migration note. Every finding, trap and memory cites at least one Avoiding Data Pitfalls rule id.

MIT licensed. Rule ids refer to the Avoiding Data Pitfalls taxonomy, which is licensed separately under CC BY-NC 4.0 (see [LICENSE-TAXONOMY.md](https://github.com/bjonesdataliteracy/datapitfalls/blob/main/LICENSE-TAXONOMY.md)).
