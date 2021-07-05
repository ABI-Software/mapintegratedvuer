const ScaffoldResponse = {
  metadata: [
    {
       "GroupName" : "cube",
       "MorphColours" : false,
       "MorphNormals" : false,
       "MorphVertices" : false,
       "Type" : "Surfaces",
       "URL" : "cube_2.json"
    }
 ],
 primitive1: {
	"metadata" : {
		"formatVersion" : 3,
		"description" : "Exported from LibZinc."
  },
  "materials" : [ {
    "DbgColor" : 15658734,
    "DbgIndex" : 0,
    "DbgName" : "my_material",
    "colorDiffuse" : [0, 0.7, 0.2],
    "colorSpecular" : [1, 1, 1],
    "shading" : "Phong",
    "specularCoef" : 50,
    "opacity" : 1,
    "vertexColors" : true
    }],
  	"vertices" : [
      0.000000,1.000000,0.000000,0.000000,0.000000,0.000000,0.000000,1.000000,1.000000,0.000000,0.000000,1.000000,1.000000,0.000000,0.000000,1.000000,1.000000,0.000000,1.000000,0.000000,1.000000,1.000000,1.000000,1.000000,0.000000,0.000000,1.000000,0.000000,0.000000,0.000000,
      1.000000,0.000000,1.000000,1.000000,0.000000,0.000000,0.000000,1.000000,0.000000,0.000000,1.000000,1.000000,1.000000,1.000000,0.000000,1.000000,1.000000,1.000000,1.000000,0.000000,0.000000,0.000000,0.000000,0.000000,1.000000,1.000000,0.000000,0.000000,1.000000,0.000000,
      0.000000,0.000000,1.000000,1.000000,0.000000,1.000000,0.000000,1.000000,1.000000,1.000000,1.000000,1.000000
    ],
    "normals" : [
      -1.000000,-0.000000,-0.000000,-1.000000,-0.000000,-0.000000,-1.000000,-0.000000,-0.000000,-1.000000,-0.000000,-0.000000,1.000000,0.000000,0.000000,1.000000,0.000000,0.000000,1.000000,0.000000,0.000000,1.000000,0.000000,0.000000,-0.000000,-1.000000,-0.000000,-0.000000,-1.000000,-0.000000,
      -0.000000,-1.000000,-0.000000,-0.000000,-1.000000,-0.000000,0.000000,1.000000,0.000000,0.000000,1.000000,0.000000,0.000000,1.000000,0.000000,0.000000,1.000000,0.000000,-0.000000,-0.000000,-1.000000,-0.000000,-0.000000,-1.000000,-0.000000,-0.000000,-1.000000,-0.000000,-0.000000,-1.000000,
      0.000000,0.000000,1.000000,0.000000,0.000000,1.000000,0.000000,0.000000,1.000000,0.000000,0.000000,1.000000
    ],
  
    "faces": [
      32 ,0,1,2 ,0,1,2,
      32 ,2,1,3 ,2,1,3,
      32 ,4,5,6 ,4,5,6,
      32 ,6,5,7 ,6,5,7,
      32 ,8,9,10 ,8,9,10,
      32 ,10,9,11 ,10,9,11,
      32 ,12,13,14 ,12,13,14,
      32 ,14,13,15 ,14,13,15,
      32 ,16,17,18 ,16,17,18,
      32 ,18,17,19 ,18,17,19,
      32 ,20,21,22 ,20,21,22,
      32 ,22,21,23 ,22,21,23
    ]
  
  }  
};

exports.ScaffoldResponse = ScaffoldResponse;