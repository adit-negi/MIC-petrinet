
define([
    'plugin/PluginConfig',
    'text!./metadata.json',
    'plugin/PluginBase'
], function (
    PluginConfig,
    pluginMetadata,
    PluginBase
) {
    'use strict';

    pluginMetadata = JSON.parse(pluginMetadata);
    
    const getCircularReplacer = () => {
        const seen = new WeakSet();
        return (key, value) => {
          if (typeof value === "object" && value !== null) {
            if (seen.has(value)) {
              return;
            }
            seen.add(value);
          }
          return value;
        };
      };


    class StateMachine extends PluginBase {
        constructor() {
            super();
            this.pluginMetadata = pluginMetadata;
        }

        async main(callback) {
            const activeNode = this.activeNode;

            try { 
                const classifications = await this.stateMachine(activeNode);
                this.logger.info('print class')
                this.logger.info(JSON.stringify(classifications))
                const messages = GetClassifcationResult(classifications);
                // Iterate through all the messages
                for (const msg of messages) {
                    // Create a message with the current message, the active node, and the 'info' label
                    this.createMessage(activeNode, msg, 'info');
                }

                this.result.setSuccess(true);
            } catch (e) {
                this.logger.error(e.message);
                this.result.setSuccess(false);
                this.createMessage(
                    activeNode,
                    e.message,
                    'error'
                );
            }
            callback(null, this.result);
        }

        async stateMachine(network) {
            const {places, transitions, paths} = await this._getGraph(network);
            this.logger.info(JSON.stringify(transitions))
            const sm = this._isSM(transitions);
            const mg = this._isMG(places);
            const fc = this._isFC(transitions);
            const wf = this._isWF(places, transitions, paths);
            return {
                sm,
                mg,
                fc,
                wf
            };
        }
          

        async _getGraph(network) {
            const children = await this.core.loadChildren(network);
            const places = {};
            const transitions = {};
            const paths = {};
            children.forEach(child => {
                const name = this.core.getAttribute(child, 'name');
                const path = this.core.getPath(child);
                if (this.core.getMetaType(child) === this.META.Places) {
                    places[path] = {
                        name: name,
                        inTransitions: new Set(),
                        outTransitions: new Set()
                    };
                    paths[path] = [];
                } else if (this.core.getMetaType(child) === this.META.Transition) {
                    transitions[path] = {
                        name: name,
                        inPlaces: new Set(),
                        outPlaces: new Set()
                    };
                    paths[path] = [];
                }
            });


            children.forEach(child => {
                this.logger.info("LGGING");
                //this.logger.info(JSON.stringify(this.core.getMetaType(child)));
                this.logger.info(JSON.stringify(this.META.P2T, getCircularReplacer()));
                if (this.core.getMetaType(child) === this.META.Arc_P_T) {
                    const inPlacePath = this.core.getPointerPath(child, 'src');
                    const dstTransitionPath = this.core.getPointerPath(child, 'dst');
                    this.logger.info("breaks here 1"); 

                    places[inPlacePath].outTransitions.push(dstTransitionPath);
                    this.logger.info("breaks here 2");
  
                    transitions[dstTransitionPath].inPlaces.push(inPlacePath);

                    paths[inPlacePath].push(dstTransitionPath);
                } else if (this.core.getMetaType(child) === this.META.Arc_T_P) {
                    const outPlacePath = this.core.getPointerPath(child, 'dst');
                    const srcTransitionPath = this.core.getPointerPath(child, 'src');
                    places[outPlacePath].inTransitions.push(srcTransitionPath);
                    transitions[srcTransitionPath].outPlaces.push(outPlacePath);
                    paths[srcTransitionPath].push(outPlacePath);
                }
            });

            return {places, transitions, paths};
        }

        _getPaths(src, dst, paths) {
            return ClassifyPetriNet._pathsList(paths, src, dst, []);
        }

        static _pathsList(graph, start, end, path = []) {
            path = path.concat([start]);
            if (start === end) {
                return [path];
            }
            if (!graph[start]) {
                return [];
            }
            const paths = [];
            graph[start].forEach(node => {
                if (!path.includes(node)) {
                    const newPaths = ClassifyPetriNet._pathsList(graph, node, end, path);
                    newPaths.forEach(newPath => {
                        paths.push(newPath);
                    });
                }
            });
            return paths;
        }

        _isFC(transitions) {
            // Create a set to store all the places that have transitions coming into them
            const allInPlaces = new Set();
        
            // Initialize a variable to store the total number of "inPlaces"
            let totalInPlaces = 0;
        
            // Iterate through all the transitions in the transitions object
            Object.values(transitions).forEach(transition => {
                // For each transition, add all its "inPlaces" to the allInPlaces set
                transition.inPlaces.forEach(inPlace => allInPlaces.add(inPlace));
        
                // Increment the totalInPlaces variable by the number of "inPlaces" for the current transition
                totalInPlaces += transition.inPlaces.size;
            });
        
            // Check if the total number of "inPlaces" is equal to the number of unique "inPlaces"
            return totalInPlaces === allInPlaces.size;
        }

        _isSM(transitions) {
            // Check if all the transitions in the transitions object have exactly one "inPlace" and one "outPlace"
            this.logger.info((JSON.stringify(transitions)));
            for (const transition of Object.values(transitions)) {
                this.logger.info("checking")
                this.logger.info((JSON.stringify(transition)));
                if (transition.inPlaces.size === 1 || transition.outPlaces.size === 1) {
                    continue
                } else{
                    return false;
                }
            }
        
            return true;
        }
        

        _isMG(places) {
            // Check if all the places in the places object have exactly one "inTransition" and one "outTransition"
            for (const place of Object.values(places)) {
                if (place.inTransitions.size !== 1 || place.outTransitions.size !== 1) {
                    return false;
                }
            }
        
            return true;
        }

        _isWF(places, transitions, paths) {
            // Get all the places and transitions in the Petri net
            const allNodes = Object.keys(places).concat(Object.keys(transitions));
        
            // Get the source and sink places of the Petri net
            let sourcePlaces = [];
            let sinkPlaces = [];
            for (const placeId of Object.keys(places)) {
                if (places[placeId].inTransitions.size === 0) {
                    sourcePlaces.push(placeId);
                }
                if (places[placeId].outTransitions.size === 0) {
                    sinkPlaces.push(placeId);
                }
            }
        
            // Check if the Petri net has exactly one source and one sink place
            if (sourcePlaces.length !== 1 || sinkPlaces.length !== 1) {
                return false;
            }
        
            // Get all the paths from the source place to the sink place
            const src = sourcePlaces.pop();
            const dst = sinkPlaces.pop();
            let allPaths = [];
            for (const path of this._getPaths(src, dst, paths)) {
                allPaths = allPaths.concat(path);
            }
        
            // Check if every place and transition in the Petri net is on a path from the source place to the sink place
            for (const node of allNodes) {
                if (!allPaths.includes(node)) {
                    return false;
                }
            }
        
            return true;
        }
    

    }

    const GetClassifcationResult = function (classifications) {
        let msgs = [];
        if (classifications.fc) {
            msgs.push('This example is a freechoice petrinet');
        } else {
            msgs.push('This example is not a freechoice petrinet' );
        }

        if (classifications.sm) {
            msgs.push('This example is a state machine' );
        } else {
            msgs.push('This example is not a state machine');
        }

        if (classifications.mg) {
            msgs.push('This example is a marked graph');
        } else {
            msgs.push('This example is not a marked graph') ;
        }

        if (classifications.wf) {
            msgs.push('This example is a workflow net');
        } else {
            msgs.push('This example is not a workflow net' );
        }

        return msgs;
    };
    return StateMachine;
});