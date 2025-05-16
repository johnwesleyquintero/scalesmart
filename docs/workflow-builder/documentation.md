# Workflow Builder Documentation

## Overview

The Workflow Builder page is a React component that allows users to create and manage workflows visually. It uses the `reactflow` library to provide a drag-and-drop interface for building workflows.

## Functionality

- **Node Creation:** Users can drag nodes from the sidebar onto the canvas to add them to the workflow.
- **Node Connection:** Users can connect nodes by dragging edges between them.
- **Workflow Saving:** Users can save the current workflow to local storage.
- **Workflow Loading:** Users can load a previously saved workflow from local storage.
- **Workflow Execution:** Users can execute the workflow, which will run the logic defined by the nodes and edges.

## Technical Details

- The page uses the `reactflow` library for the visual workflow builder.
- The `DndProvider` component from `react-dnd` is used to enable drag and drop functionality.
- Workflows are stored in local storage as JSON objects.
- The `nodeRegistry` object is used to register different types of nodes.

## Components

- `WorkflowCanvas`: The main canvas where users build the workflow.
- `DraggableNode`: A component that represents a draggable node in the sidebar.

## Data Flow

1.  The `WorkflowBuilderPage` component initializes the `nodes` and `edges` state variables with some default nodes and edges.
2.  Users can drag nodes from the sidebar onto the canvas and connect them with edges.
3.  The `onNodesChange` and `onEdgesChange` functions update the `nodes` and `edges` state variables, respectively.
4.  The `onConnect` function adds a new edge to the `edges` state variable when two nodes are connected.
5.  The `saveWorkflow` function saves the current workflow to local storage as a JSON object.
6.  The `loadWorkflow` function loads a previously saved workflow from local storage and updates the `nodes` and `edges` state variables.
7.  The `executeWorkflow` function executes the workflow by calling the `executeWorkflow` function from the `@/lib/workflow/engine` module.
