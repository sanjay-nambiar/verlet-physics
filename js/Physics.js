function createPhysics(logger) {
	'use strict';

	// Represents a 2D vector
	function Vector(x, y)
	{
		this.x = x;
		this.y = y;
		
		this.magnitude = function()
		{
			return Math.sqrt(x*x+y*y);
		}
		
		this.set = function(a)
		{
			this.x = a.x;
			this.y = a.y;
		}
		
		this.add = function(a)
		{
			return new Vector(this.x+a.x, this.y+a.y);
		}
		
		this.addTo = function(a)
		{
			this.x += a.x;
			this.y += a.y;
		}
		
		this.sub = function(a)
		{
			return  new Vector(this.x-a.x, this.y-a.y);
		}
		
		this.subFrom = function(a)
		{
			this.x -= a.x;
			this.y -= a.y;
		}
		
		this.mul = function(k)
		{
			return new Vector(this.x*k, this.y*k);
		}
		
		this.mulWith = function(k)
		{
			this.x *= k;
			this.y *= k;
		}
		
		this.div = function(k)
		{
			return new Vector(this.x/k, this.y/k);
		}
		
		this.divBy = function(k)
		{
			this.x /= k;
			this.y /= k;
		}
		
		this.dot = function(a)
		{
			return ((this.x*a.x)+(this.y*a.y));
		}
		
		this.reverse = function()
		{
			this.x = -this.x;
			this.y = -this.y;
		}
		
		this.normalize = function()
		{
			var mag = this.magnitude();
			this.x /= mag;
			this.y /= mag;
		}
		
		this.equals = function(a)
		{
			if( this.x == a.x && this.y == a.y )
				return true;
			return false;
		}
	}
	Vector.zero = function() {
		return new Vector(0,0);
	};






	function Vertex(x, y)
	{
		this.position = new Vector(x, y);
		this.oldPosition = new Vector(x, y);
		this.acceleration = new Vector(0,0);
		
		this.set = function(a)
		{
			this.position = a.position;
			this.oldPosition = a.oldPosition;
			this.acceleration = a.acceleration;
		}
		
		this.equals = function(a)
		{
			if( this.position.equals(a.position) == true &&
			    this.oldPosition.equals(a.oldPosition) == true &&
			    this.acceleration.equals(a.acceleration) == true )
				return true;
			return false;
		}
	}	
	Vertex.zero = function()
	{
		return (new Vertex(0,0));
	}





	function Edge(v1, v2, boundary)
	{
		this.v1 = v1;
		this.v2 = v2;
		this.restLengthSq = this.v2.position.sub(this.v1.position).magnitude();
		this.restLengthSq *= this.restLengthSq;
		this.boundary = boundary;
		
		this.vector = function()
		{
			return this.v2.position.sub(this.v1.position);
		}
		
		this.length = function()
		{
			return this.v2.position.sub(this.v1.position).magnitude();
		}
	}
	Edge.zero = function()
	{
		return (new Edge(Vector.zero(), Vector.zero(), true));
	}






	function Body(vertices, edgeMappings, base, world)
	{
		this.vertexCount = vertices.length;
		this.vertices = [];				
		this.edges = [];
		this.center;
		this.minX;
		this.maxX;
		this.minY;
		this.maxY;
		this.base;
		this.angle;
		this.horizontal = new Vector(1,0);
		this.anchor;


		for(var i=0; i<this.vertexCount; i++)
		{
			this.vertices.push(new Vertex(0,0));
			this.vertices[i].set(vertices[i]);
			world.addVertex(this.vertices[i]);
		}

		this.edgeCount = edgeMappings.length;
		for(var i=0; i<edgeMappings.length; i++)
		{
			this.edges.push(new Edge(this.vertices[edgeMappings[i][0]],
						 this.vertices[edgeMappings[i][1]],
						 edgeMappings[i][2]));
			world.addEdge(this.edges[i]);
		}
		world.addBody(this);

		if(base.reverse == true)
			this.base = new Edge(this.edges[base.baseIndex].v2, this.edges[base.baseIndex].v1);
		else
			this.base = this.edges[base.baseIndex];


		this.findCenter = function()
		{
			this.minX = this.minY = 1000000000;
			this.maxX = this.maxY = -1000000000;
			
			this.center = Vector.zero();
			for(var i=0; i<this.vertexCount; i++)
			{
				this.center.addTo(this.vertices[i].position);
				this.minX = Math.min(this.minX, this.vertices[i].position.x);
				this.maxX = Math.max(this.maxX, this.vertices[i].position.x);
				this.minY = Math.min(this.minY, this.vertices[i].position.y);
				this.maxY = Math.max(this.maxY, this.vertices[i].position.y);
			}
			this.center.divBy(this.vertexCount);
			var baseVector = this.base.vector();
			this.angle = Math.acos(baseVector.x/baseVector.magnitude());
		}		
		this.findCenter();


		this.projectToAxis = function(axis, bounds)
		{
			var dot = axis.dot(this.vertices[0].position);
			bounds.min = bounds.max = dot;
			for(var i=0; i<this.vertices.length; i++)
			{
				dot = axis.dot(this.vertices[i].position);
				bounds.min = Math.min(dot, bounds.min);
				bounds.max = Math.max(dot, bounds.max);
			}
		}
	}





	function World(worldMaxX, worldMaxY, gravity, friction)
	{
		function CollisionInfo()
		{
			this.depth = 0;
			this.normal = Vector.zero();
			this.edge;
			this.edgeParent = 0;
			this.vertex = Vertex.zero();
		}


		this.worldMaxX = worldMaxX;
		this.worldMaxY = worldMaxY;
		this.gravity = new Vector(gravity.x, gravity.y);
		this.friction = new Vector(friction.x, friction.y);
		this.time = 0;
		this.timestep = 0;
		this.vertices = [];
		this.edges = [];
		this.bodies = [];
		this.collisionInfo = new CollisionInfo();



		this.sgn = function(value)
		{
			if( value > 0 )
				return 1;
			else if( value == 0 )
				return 0;
			else
				return -1;
		}
		
		this.addVertex = function(vertex)
		{
			this.vertices.push(vertex);
		}

		this.addVertices = function(vertices) {
			for(var i = 0; i < vertices.length; i++) {
				this.addVertex(vertices[i]);
			}
		}

		this.addEdge = function(edge)
		{
			this.edges.push(edge);
		}

		this.addEdges = function(edges) {
			for(var i = 0; i < edges.length; i++) {
				this.addEdge(edges[i]);
			}
		}

		this.addBody = function(body)
		{
			//this.addVertices(body.vertices);
			//this.addEdges(body.edges);
			this.bodies.push(body);
		}

		this.addBodies = function(bodies) {
			for(var i = 0; i < bodies.length; i++) {
				this.addBody(bodies[i]);
			}
		}

		this.sign = function(value)
		{
			return (value<0)?-1:1;
		}

		this.updateForces = function()
		{
			for(var i=0; i<this.vertices.length; i++)
			{
				this.vertices[i].acceleration.set(this.gravity);
			}
		}


		this.updateVertices = function()
		{
			var vertex;
			var temp = Vector.zero();
			for(var i=0; i<this.vertices.length; i++)
			{
				vertex = this.vertices[i];
				temp.set(vertex.position);
				vertex.position.addTo(vertex.position.sub(vertex.oldPosition)
						.add(vertex.acceleration.mul(this.timestep*this.timestep).mul(this.sgn(this.timestep))));
				vertex.oldPosition.set(temp);
			}
		}


		this.updateEdges = function()
		{
			var edge;
			var v1v2;
			for(var i=0; i<this.edges.length; i++)
			{
				edge = this.edges[i];
				v1v2 = edge.vector();
				v1v2.mulWith(edge.restLengthSq/(v1v2.dot(v1v2)+edge.restLengthSq)-0.5);
				edge.v1.position.subFrom(v1v2);
				edge.v2.position.addTo(v1v2);				
			}
		}


		this.intervalDistance = function(boundsA, boundsB)
		{
			if( boundsA.min < boundsB.min )
				return boundsB.min - boundsA.max;
			else
				return boundsA.min - boundsB.max;
		}



		this.bodiesOverlap = function(body1, body2)
		{
			if( (body1.minX <= body2.maxX) && (body1.minY <= body2.maxY) &&
			    (body1.maxX >= body2.minX) && (body1.maxY >= body2.minY) )
				return true;
			else
				return false;
		}



		this.detectCollisions = function(body1, body2)
		{
			var minDistance = 1000000000;
			for(var i=0; i<body1.edgeCount + body2.edgeCount; i++)
			{
				if( i < body1.edgeCount )
				{
					var edge = body1.edges[i];
					var body = 1;
				}
				else
				{
					var edge = body2.edges[i-body1.edgeCount];
					var body = 2;
				}
				
				if( edge.boundary == false )
					continue;

				var axis = new Vector(edge.v1.position.y - edge.v2.position.y, edge.v2.position.x - edge.v1.position.x);
				axis.normalize();
				
				var boundsA = {min:0,max:0}, boundsB = {min:0,max:0};
				body1.projectToAxis(axis, boundsA);
				body2.projectToAxis(axis, boundsB);
				
				var distance = this.intervalDistance(boundsA, boundsB);
				if( distance > 0 )
					return false;
				else if( Math.abs(distance) < minDistance )
				{
					minDistance = Math.abs(distance);
					this.collisionInfo.normal = axis;
					this.collisionInfo.edge = edge;
					this.collisionInfo.edgeParent = body;
				}
			}
			
			this.collisionInfo.depth = minDistance;
			if( this.collisionInfo.edgeParent != 2 )
			{
				var temp = body2;
				body2 = body1;
				body1 = temp;
			}
			
			var sign = this.collisionInfo.normal.dot(body1.center.sub(body2.center));
			sign = (sign>0)? 1: -1;
			
			if( sign != 1 )
				this.collisionInfo.normal.reverse();
				
			minDistance = 1000000000;
			for(var i=0; i<body1.vertexCount; i++)
			{
				var distance = this.collisionInfo.normal.dot(body1.vertices[i].position.sub(body2.center));
				if( distance < minDistance )
				{
					minDistance = distance;
					this.collisionInfo.vertex = body1.vertices[i];
				}
			}
			return true;
		}
		


		this.collisionResponse = function()
		{
			var collisionVector = this.collisionInfo.normal.mul(this.collisionInfo.depth);
			var v1 = this.collisionInfo.edge.v1,
			    v2 = this.collisionInfo.edge.v2;
			    
			if( Math.abs(v1.position.x - v2.position.x) > Math.abs(v1.position.y - v2.position.y) )
				var temp = (this.collisionInfo.vertex.position.x - collisionVector.x) / (v2.position.x - v1.position.x);
			else
				var temp = (this.collisionInfo.vertex.position.y - collisionVector.y) / (v2.position.y - v1.position.y);
				
			var lambda = 0.5 / (temp*temp + (1-temp)*(1-temp));
			v1.position.subFrom(collisionVector.mul((1-temp)*lambda));
			v2.position.subFrom(collisionVector.mul(temp*lambda));
			
			this.collisionInfo.vertex.position.addTo(collisionVector.mul(0.5));
		}



		this.iterateCollisions = function(iterations)
		{
			var position;
			for(var n=0; n<iterations; n++)
			{
				for(var i=0; i<this.vertices.length; i++)
				{
					position = this.vertices[i].position;
					position.x = Math.max(Math.min(position.x, this.worldMaxX), 0);
					position.y = Math.max(Math.min(position.y, this.worldMaxY), 0);
				}
				
				this.updateEdges();
				
				for(var i=0; i<this.bodies.length; i++)
					this.bodies[i].findCenter();
					
				for(var b1 = 0; b1 < this.bodies.length; b1++)
					for(var b2 = 0; b2 < this.bodies.length; b2++)
						if( b1 != b2 )
							if( this.bodiesOverlap(this.bodies[b1], this.bodies[b2]) == true )
								if( this.detectCollisions(this.bodies[b1], this.bodies[b2]) == true )
									this.collisionResponse();
			}
		}


		this.letTheWorldRun = function(iterations, time)
		{
			this.updateForces();
			this.timestep = time - this.time;
			this.updateVertices();
			this.iterateCollisions(iterations);
			this.time = time;
			//console.log("vertices = " + JSON.stringify(this.vertices));
		}
	}

	logger.debug("Successfully created physics manager.");
	return {
		Vector: Vector,
		Vertex: Vertex,
		Edge: Edge,
		Body: Body,
		World: World
	};
}
