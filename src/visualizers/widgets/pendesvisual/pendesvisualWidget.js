 define(['jointjs', 'css!./styles/pendesvisualWidget.css', 'css!jointjscss'], function (jointjs) {
     'use strict';
 
     var WIDGET_CLASS = 'pendesvisual';
    
     function pendesvisualWidget(logger, container, client) {
         this._logger = logger.fork('Widget');
 
         this._el = container;
         this._client = client;
         this._removeArcs = {};
         this._places = {};
         this._transitions = {};
         this._arcs = {};
 
         this._initialize();
 
         this._logger.debug('ctor finished');
     }
 
     pendesvisualWidget.prototype._initialize = function () {
         const width = this._el.width();
         const height = this._el.height();
         const self = this;
 
         this._el.addClass(WIDGET_CLASS);
 
         this._jointSM = new jointjs.dia.Graph;
         this._jointPaper = new jointjs.dia.Paper({
             el: $(this._el),
             width, height,
             defaultConnectionPoint: { name: 'boundary' },
             gridSize: 1,
             model: this._jointSM,
         });
 
         this._jointPaper.setInteractivity(false);
         this._jointPaper.removeTools();
 
         
        this._jointPaper.on('element:mousewheel', function(view, delta) {
            // Get the element that was clicked
            const elem = view.model;
        
            // Get the place corresponding to the clicked element, if any
            const place = self.pCid(elem.cid);
        
            // Check if the place is defined
            if (place !== undefined) {
                // Add the specified number of markings to the place
                const marks = addAttrMark(place.current);
                console.log("logging marks");
                console.log(marks);    
                moveMarkings(place.current, delta > 0 ? marks + 1 : marks - 1);
    
                // Update the transition status after changing the markings
                self.UpdateTransStatus();
                
            }
        });

        this._jointPaper.on('element:pointerclick', function(view) {
            // Get the element that was clicked
            const elem = view.model;
        
            // Get the transition corresponding to the clicked element, if any
            const trans = self.tCid(elem.cid);
        
            // Check if the transition is defined and enabled
            if (trans !== undefined && self.isTransitionEnabled(trans)) {
                // Trigger the transition
                self.triggerTrans(trans);
            }
        });
 
         this._place = jointjs.dia.Element.define('network.Place', attributes, markup);
         console.log("test");
         console.log(this._place);
     };
 
     pendesvisualWidget.prototype.onWidgetContainerResize = function (width, height) {
         this._logger.debug('Widget is resizing...');
     };
     
     pendesvisualWidget.prototype.DrawArcs = function () {
        const toDelete = [];
       // Iterate through the entries in the removeArcs object
        for (const [key, value] of Object.entries(this._removeArcs)) {
            // Get the source and destination nodes of the current arc
            const src = this.getValidNode(value.src);
            const dst = this.getValidNode(value.dst);

            // If the source and destination nodes are valid, process the arc
            if (src !== undefined && dst !== undefined) {
                // Add the arc to the list of arcs to be deleted
                toDelete.push(key);

                // Check if the arc already exists
                let flag = false;
                for (const val of Object.values(this._arcs)) {
                    if (val.src === src && val.dst === dst) {
                        flag = true;
                        break;
                    }
                }

                // If the arc already exists, skip to the next arc
                if (flag) continue;

                // Create a new JointJS link for the arc
                const arc = new jointjs.shapes.standard.Link();
                arc.source(src.current, { anchor: { name: 'center' } });
                arc.target(dst.current, { anchor: { name: 'center' } });

                // Add the arc to the JointJS diagram
                this._jointSM.addCell([arc]);

                // Add the arc to the arcs object
                this._arcs[key] = {
                    id: key,
                    src, dst,
                    current: arc,
                    gmenode: value.gmenode,
                };
            }
        }

        for (const key of toDelete) {
            delete this._removeArcs[key];
        }
    };
    pendesvisualWidget.prototype.addNode = function (desc) {

        const node = this._client.getNode(desc.id);
        // Check if the current node is a place
        if (node.isInstanceOf("Places")) {
            // Get the position of the place
            const position = node.getRegistry('position');

            // Create a new JointJS place element at the given position
            const place = new this._place({
                position,
                attrs: {
                    text: { text: node.getAttribute('name') },
                },
            });

            // Move the markings of the place according to the initial marking attribute of the node
            console.log('loggin marks 5');
            moveMarkings(place, node.getAttribute('initMarking'));

            // Add the place to the JointJS diagram
            this._jointSM.addCell([place]);

            // Add the place to the places object
            this._places[desc.id] = {
                id: desc.id,
                current: place,
                gmenode: node,
            };

            // Redraw the arcs and update the status of the transitions
            this.DrawArcs();
            this.UpdateTransStatus();
        }

        else if (node.isInstanceOf('Transition')) {
            const position = node.getRegistry('position');
            const trans = new jointjs.shapes.pn.Transition({
                position: { x: position.x - 5, y: position.y - 23 },
                attrs: {
                    '.label': { text: node.getAttribute('name'), fill: '#000000' },
                    '.root': { fill: '#000000', stroke: '#000000' },
                },
            });
            this._jointSM.addCell([trans]);
            this._transitions[desc.id] = {
                id: desc.id,
                current: trans,
                gmenode: node,
            };
            this.DrawArcs();
            this.UpdateTransStatus();
        }
        else if (node.isInstanceOf('Arc')) {
            const src = node.getPointerId('src');
            const dst = node.getPointerId('dst');
            this._removeArcs[desc.id] = {
                src, dst,
                gmenode: node,
            };
            this.DrawArcs();
            this.UpdateTransStatus();
        }
    };

     pendesvisualWidget.prototype.resetMarkings = function() {
         for (const place of Object.values(this._places)) {
             console.log("loggin marks 2");
             console.log(place);
             moveMarkings(place.current, place.gmenode.getAttribute('initMarking'));
         }
         this.UpdateTransStatus();
     };

     pendesvisualWidget.prototype.isTransitionEnabled = function(trans) {
        const inplaces = this.listInplaces(trans);
        for (const p of inplaces) {
            if (addAttrMark(p.place.current) <= 0) return false;
        }
        return true;
    };

    pendesvisualWidget.prototype.listInplaces = function(trans) {
        //get all the inplaces , i.e src of transition
        const inplaces = [];
        const arcs = Object.values(this._arcs);
        for (let i = 0; i < arcs.length; i++) {
          const arc = arcs[i];
          if (arc.dst == trans) inplaces.push({ place: arc.src, arc });
        }
        return inplaces;
      };
     pendesvisualWidget.prototype.listOutplaces = function(trans) {
         //get all the inplaces , i.e dst of transition
        const inplaces = [];
        const arcs = Object.values(this._arcs);
        for (let i = 0; i < arcs.length; i++) {
          const arc = arcs[i];
          if (arc.src == trans) inplaces.push({ place: arc.dst, arc });
        }
        return inplaces;
     };
     

     //After the loop, if none of the transitions are enabled (i.e., transitionsAllowed is still false), 
     //the code sets the color of all the transitions to red (#880808).
     // This is done by looping through all the transitions again and setting their colors using the transition.current.attr method.
     pendesvisualWidget.prototype.UpdateTransStatus = function() {
         let transitionsAllowed = false;
         //In the loop, the code checks if each transition is enabled using the this.isTransitionEnabled method.
         // If the transition is enabled, the code sets the transitionColor to blue (#00aacc). Otherwise, it sets the transitionColor to black (#000000).
         for (const i of Object.values(this._transitions)) {
             const enabled = this.isTransitionEnabled(i)
             if (enabled) transitionsAllowed = true;
             var transitionColor = "00aacc"
             if (!enabled) transitionColor = '#000000'

             i.current.attr('.root/fill', transitionColor);
         }
         if (!transitionsAllowed) {
            const vals = Object.values(this._transitions);
            for (let i = 0; i < vals.length; i++) {
                const currTransition = vals[i];
                currTransition.current.attr('.root/fill', '#880808'); 
            }
         }
     }
 
     
     pendesvisualWidget.prototype.triggerTrans= function(trans) {
         const inplaces = this.listInplaces(trans);
         const outplaces = this.listOutplaces(trans);
         const self = this;
         const handleOutplaces = function() {
             // Iterate through each place in the array of places
            for (const p of outplaces) {
                // Find the view for the current place and send a token to it
                p.arc.current.findView(self._jointPaper).sendToken(
                    // Create a small circle with a green fill color to use as the token
                    jointjs.V('circle', { r: 5, fill: '#46ff1c' }),
                    // Send the token over a duration of 750 milliseconds
                    750,
                    // Call a function after the token has been sent
                    () => {
                        // Log a message to the console
                        console.log('logging marks 3');
                        // Update the markings on the current place
                        moveMarkings(p.place.current, addAttrMark(p.place.current) + 1);
                        // Update the colors of the places in the diagram
                        self.UpdateTransStatus();
                    }
                );
            }

         };
         if (inplaces.length !== 0) {
             for (const p of inplaces) {
                 console.log('logging marks 4');
                 moveMarkings(p.place.current, addAttrMark(p.place.current) - 1);
             }
             this.UpdateTransStatus(); // update colors after decrementing everything
             const inplaceNode= inplaces.pop();
             for (const p of inplaces) {
                // Find the view for the current place and send a token to it
                p.arc.current.findView(this._jointPaper).sendToken(
                    // Create a small circle with a green fill color to use as the token
                    jointjs.V('circle', { r: 5, fill: '#46ff1c' }),
                    // Send the token over a duration of 750 milliseconds
                    750
                );
            }
            
            // Find the view for the last place in the array of input places and send a token to it
            inplaceNode.arc.current.findView(this._jointPaper).sendToken(
                // Create a small circle with a green fill color to use as the token
                jointjs.V('circle', { r: 5, fill: '#46ff1c' }),
                // Send the token over a duration of 750 milliseconds
                750,
                // Call a function after the token has been sent
                handleOutplaces
            );
         }
         else handleOutplaces(); // if no inputs, just do the outputs
     };
 
     pendesvisualWidget.prototype.pCid = function(cid) {
         for (const place of Object.values(this._places)) {
             if (place.current.cid === cid) return place;
         }
         return undefined;
     };
     pendesvisualWidget.prototype.tCid= function(cid) {
         for (const trans of Object.values(this._transitions)) {
             if (trans.current.cid === cid) return trans;
         }
         return undefined;
     };
 
     pendesvisualWidget.prototype.getValidNode = function(id) {
         if (id in this._places) return this._places[id];
         if (id in this._transitions) return this._transitions[id];
         return undefined;
     };
    
     pendesvisualWidget.prototype.removeNode = function (gmeId) {
    };
     pendesvisualWidget.prototype.updateNode = function (desc) {
    };
     /* * * * * * * * Visualizer life cycle callbacks * * * * * * * */
     pendesvisualWidget.prototype.destroy = function () {
     };
     pendesvisualWidget.prototype.onActivate = function () {
         this._logger.debug('pendesvisualWidget has been activated');
     };
     pendesvisualWidget.prototype.onDeactivate = function () {
         this._logger.debug('pendesvisualWidget has been deactivated');
     };
 
     return pendesvisualWidget;
 });

const markup = {
    markup: [
        { tagName: 'circle', selector: 'circle' },
        { tagName: 'text', selector: 'text' },
        { tagName: 'text', selector: 'label' },
    ],
}
  function addAttrMark(place) {
     console.log("get marks function called");
     console.log(place.attr('marks'));
     return place.attr('marks');
 }
 function moveMarkings(place, count) {
     place.attr('marks', count);
     var mark = "";
     if (count < 0 || count > 12){ 
        mark = "invalid count";
    } else{
        for (i=0; i<count; i++){
            mark+= "⚫";
            if (i%3==0) mark+="\n"
        }
    }

     place.attr('label/text', mark);
 }

 const attributes = {
    attrs: {
        circle: {
            r: 35,
            strokeWidth: 3,
            stroke: '#000000',
            fill: '#ffffff',

        },
        text: {
            'font-weight': 'bold',
            textAnchor: 'middle',
            textVerticalAnchor: 'middle',
            x: 0.6,
            y: -50,
            'ref': 'circle',

        },
        label: {
            'font-weight': 'bold',
            'text-anchor': 'middle',
            y: 20,
            'ref': 'circle',

        },
        marks: 0,
    },
};

