Background Worker Main/
├─ Commands to Main Thread
├─ Discussion Thread/
│  ├─ Main thread - Reads commands and holds execution timer
├─ Manga Thread/
│  ├─ Main Thread - Listener/Manager
│  ├─ Worker Threads/
│  │  ├─ Read Manga Worker - 1/8
│  │  ├─ Sole subscription Worker - 1/8
|  |  ├─ Genre similar Worker - 1/4
|  |  ├─ Random Progression - 1/2