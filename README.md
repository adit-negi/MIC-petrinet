# Petrinet
A Petri Net is a graph model for the control behavior of systems exhibiting concurrency in their operation. The graph is bipartite, the two node types being places drawn as circles, and transitions drawn as bars. The arcs of the graph are directed and run from places to transitions or vice versa. Each place may be empty, or hold a finite number of tokens. The state of a Petri net is the distribution of tokens on its places, called a marking of the net. A transition is enabled if each of its input places holds at least one token. Firing a transition means removing one token from each input place and adding one token to each output place. A run of a Petri net is any sequence of firings of enabled transitions; a run defines a sequence of markings. Because many transitions may be enabled in a state, there are often many possible distinct runs of a Petri net. Hence, a Petri net represents a kind of nondeterministic state machine, but in a convenient form for modeling and analyzing concurrent systems. Various extensions and generalizations of Petri nets have been found useful in applications.

## Petrinet Use cases
As a mathematical tool, it can be used to set up algebraic equations, state equations, and other mathematical models governing systems. Due to the nature of the tool, it also lends itself rather handily to the modeling of logical systems, including those that may occur in computer science or communication systems.


## Initialization
The easiest way to start using this project is to fork it in git. Alternatively, you can create your empty repository, copy the content and just rename all instances of 'MIC-petrinet' to your liking. Assuming you fork, you can start-up following this few simple steps:
- install [Docker-Desktop](https://www.docker.com/products/docker-desktop)
- clone the repository
- edit the '.env' file so that the BASE_DIR variable points to the main repository directory
- `docker-compose up -d`
- connect to your server at http://localhost:8888

## About my project
Once you have started the server on localhost, you can open project test3. Alternatively you can create a new project using petrinetV2 as the seed for it. 

### Functionalities implemented - 
1. <b>Transtions </b>
    <br>
    a. All transitions enabled transitions will be colored white, on cliking those they will simulate movement of balls from one place to another <br>
    b. All disabled transitions will be coloured black, clicking those will lead to no result.<br>
    c. On reaching a deadlock state i.e no valid transition. All transitions should change to the color red.<br>
    ![alt text](https://github.com/adit-negi/MIC-petrinet/blob/hotfix/readme/images/micimg1.png)
    ![alt text](https://github.com/adit-negi/MIC-petrinet/blob/hotfix/readme/images/micimg2.png)
2.<b> Plugin </b><br>
    a. Onclicking the question mark icon on the top right the plugin should trigger and you will be able to see is this petrinet is a state machine,free choice or marked graph.<br>
    ![alt text](https://github.com/adit-negi/MIC-petrinet/blob/main/images/pluginwebgme.jpg)
    
### VIDEO DEMO
[![Watch the video](https://github.com/adit-negi/MIC-petrinet/blob/main/images/MicDemo.png)](https://www.loom.com/share/b4a0ebca0ab2417d8ed2e4c7892c7c19)
## Main docker commands
All of the following commands should be used from your main project directory (where this file also should be):
- To **rebuild** the complete solution `docker-compose build` (and follow with the `docker-compose up -d` to restart the server)
- To **debug** using the logs of the WebGME service `docker-compose logs webgme`
- To **stop** the server just use `docker-compose stop`
- To **enter** the WebGME container and use WebGME commands `docker-compose exec webgme /usr/bin` (you can exit by simply closing the command line with linux command 'exit') 
- To **clean** the host machine of unused (old version) images `docker system prune -f`
## Using WebGME commands to add components to your project
In general, you can use any WebGME commands after you successfully entered the WebGME container. It is important to note that only the src directory is shared between the container and the host machine, so you need to additionally synchronize some files after finishing your changes inside the container! The following is few scenarios that frequently occur:
### Adding new npm dependency
When you need to install a new library you should follow these steps:
- enter the container
- `npm i -s yourNewPackageName`
- exit the container
- copy the package.json file `docker-compose cp webgme:/usr/app/package.json package.json`

__Alternatively, run the 'add_npm_package.bat(sh)' and follow instructions.__
### Adding new interpreter/plugin to your DS
Follow these steps to add a new plugin:
- enter the container
- for JS plugin: `npm run webgme new plugin MyPluginName`
- for Python plugin: `npm run webgme new plugin --language Python MyPluginName`
- exit container
- copy webgme-setup.json `docker-compose cp webgme:/usr/app/webgme-setup.json webgme-setup.json`
- copy webgme-config `docker-compose cp webgme:/usr/app/config/config.webgme.js config/config.webgme.js`

__Alternatively, run the 'create_plugin.bat(sh)' and follow instructions.__
### Adding new visualizer to your DS
Follow these steps to add a new visualizer:
- enter the container
- `npm run webgme new viz MyVisualizerName`
- exit container
- copy webgme-setup.json `docker-compose cp webgme:/usr/app/webgme-setup.json webgme-setup.json`
- copy webgme-config `docker-compose cp webgme:/usr/app/config/config.webgme.js config/config.webgme.js`

__Alternatively, run the 'create_visualizer.bat(sh)' and follow instructions.__
### Adding new seed to your DS
Follow these steps to add a new seed based on an existing project in your server:
- enter the container
- `npm run webgme new seed MyProjectName -n MySeedName`
- exit container
- copy webgme-setup.json `docker-compose cp webgme:/usr/app/webgme-setup.json webgme-setup.json`
- copy webgme-config `docker-compose cp webgme:/usr/app/config/config.webgme.js config/config.webgme.js`

__Alternatively, run the 'create_seed.bat(sh)' and follow instructions.__
