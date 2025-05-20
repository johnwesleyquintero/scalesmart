# Workflow Builder Documentation

## Overview

The Workflow Builder page is a React component that allows users to create and manage workflows visually. It uses the `reactflow` library to provide a drag-and-drop interface for building workflows.

## Functionality

- **Node Creation:** Users can drag nodes from the sidebar onto the canvas to add them to the workflow.
- **Node Connection:** Users can connect nodes by dragging edges between them.
- **Workflow Saving:** Users can save the current workflow to IndexedDB.
- **Workflow Loading:** Users can load a previously saved workflow from IndexedDB.
- **Workflow Execution:** Users can execute the workflow, which will run the logic defined by the nodes and edges.

## Additional Notes:

```

## Git

```

@git-changes Execute Git commands to commit and push all staged changes to the remote repository. Generate concise, descriptive, and informative commit messages that accurately reflect the nature and scope of each change. Prioritize messages that clearly explain _why_ the changes were made, not just _what_ was changed. Use the imperative mood in commit messages. After committing and pushing, verify the successful execution of the operations and report any errors.

```

## Documentation

```

@documentation Refine and expand the documentation within the `docs/` directory. Specifically, identify and modify the documentation files that reflect recent implementations and code changes. Ensure accuracy, clarity, and completeness in the updated documentation, reflecting the current state of the codebase.

```

## Technical Details

- The page uses the `reactflow` library for the visual workflow builder.
- The `DndProvider` component from `react-dnd` is used to enable drag and drop functionality.
- Workflows are stored in IndexedDB as JSON objects.
- The `nodeRegistry` object is used to register different types of nodes.

## Components

- `WorkflowCanvas`: The main canvas where users build the workflow.
- `DraggableNode`: A component that represents a draggable node in the sidebar.

## Data Flow

1.  The `WorkflowBuilderPage` component initializes the `nodes` and `edges` state variables with some default nodes and edges.
2.  Users can drag nodes from the sidebar onto the canvas and connect them with edges.
3.  The `onNodesChange` and `onEdgesChange` functions update the `nodes` and `edges` state variables, respectively.
4.  The `onConnect` function adds a new edge to the `edges` state variable when two nodes are connected.
5.  The `saveWorkflow` function saves the current workflow to IndexedDB as a JSON object.
6.  The `loadWorkflow` function loads a previously saved workflow from IndexedDB and updates the `nodes` and `edges` state variables.
7.  The `executeWorkflow` function executes the workflow by calling the `executeWorkflow` function from the `@/lib/workflow/engine` module.
```
