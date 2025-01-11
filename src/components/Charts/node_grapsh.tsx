"use client";
import { FC, useEffect, CSSProperties } from "react";
import { MultiDirectedGraph } from "graphology";
import { SigmaContainer, useLoadGraph } from "@react-sigma/core";
import "@react-sigma/core/lib/react-sigma.min.css";
import Papa from "papaparse";

// Define a simpler type for our data structure
interface GraphData {
  products: {
    [key: string]: string[]; // product name -> array of ingredients
  };
  ingredients: {
    [key: string]: string[]; // ingredient name -> array of products
  };
}

const MyGraph: FC = () => {
  const loadGraph = useLoadGraph();
  const stringToColour = (str: string) => {
    let hash = 0;
    str.split("").forEach((char) => {
      hash = char.charCodeAt(0) + ((hash << 5) - hash);
    });
    let colour = "#";
    for (let i = 0; i < 3; i++) {
      const value = (hash >> (i * 8)) & 0xff;
      colour += value.toString(16).padStart(2, "0");
    }
    return colour;
  };
  console.log(localStorage.getItem("parsedCSVData"));

  useEffect(() => {
    const graph = new MultiDirectedGraph();

    // Function to parse ingredient string into array
    const parseIngredients = (ingredientStr: string) => {
      try {
        return JSON.parse(ingredientStr.replace(/'/g, '"'));
      } catch (e) {
        console.error("Error parsing ingredients:", ingredientStr);
        return [];
      }
    };

    // Function to process CSV data
    const processData = (results: Papa.ParseResult<any>) => {
      graph.clear();

      const data = results.data;
      const productCount = data.length;
      const radius = 400;
      const centerX = 400;
      const centerY = 400;

      // Initialize simplified graph data structure
      const graphData: GraphData = {
        products: {},
        ingredients: {},
      };

      // Process data and build relationships
      data.forEach((row, index) => {
        if (row.product_name) {
          // Calculate position in a circle for products
          const angle = (2 * Math.PI * index) / productCount;
          const x = centerX + radius * Math.cos(angle);
          const y = centerY + radius * Math.sin(angle);
          const size = row.carbon_emissions / 50000;
          // Add to graph visualization
          graph.addNode(row.product_name, {
            x,
            y,
            label: row.product_name,
            size: size,
            color: stringToColour(row.product_name),
          });

          const ingredients = parseIngredients(row.ingredients);
          graphData.products[row.product_name] = ingredients;

          const ingredientCount = ingredients.length;
          ingredients.forEach((ingredient: string, ingIndex: number) => {
            // Add to ingredients mapping
            if (!graphData.ingredients[ingredient]) {
              graphData.ingredients[ingredient] = [];
            }
            graphData.ingredients[ingredient].push(row.product_name);

            // Graph visualization logic
            const ingredientRadius = 100;
            const ingredientAngle = (2 * Math.PI * ingIndex) / ingredientCount;
            const ingX = x + ingredientRadius * Math.cos(ingredientAngle);
            const ingY = y + ingredientRadius * Math.sin(ingredientAngle);

            if (!graph.hasNode(ingredient)) {
              graph.addNode(ingredient, {
                x: ingX,
                y: ingY,
                label: ingredient,
                size: 7,
                color: "#666666",
              });
            }

            const edgeId = `${row.product_name}-${ingredient}`;
            graph.addEdgeWithKey(edgeId, row.product_name, ingredient, {
              size: 1,
              label: "contains",
            });
          });
        }
      });

      // Store in localStorage and dispatch event with the data
      localStorage.setItem("graphData", JSON.stringify(graphData));
      window.dispatchEvent(
        new CustomEvent("graphDataUpdated", {
          detail: graphData,
        }),
      );

      loadGraph(graph);
    };

    // Function to handle CSV content
    const handleCSVContent = (csvContent: string) => {
      Papa.parse(csvContent, {
        header: true,
        complete: processData,
      });
    };

    // Initial load of CSV from localStorage if exists
    const savedCSV = localStorage.getItem("uploadedCSV");
    if (savedCSV) {
      handleCSVContent(savedCSV);
    }

    // Listen for new CSV uploads
    const handleCSVUpload = () => {
      const newCSV = localStorage.getItem("uploadedCSV");
      if (newCSV) {
        handleCSVContent(newCSV);
      }
    };

    window.addEventListener("csvUploaded", handleCSVUpload);

    // Cleanup
    return () => {
      window.removeEventListener("csvUploaded", handleCSVUpload);
      <div className="flex justify-end gap-4.5">

    </div>
    };
  }, [loadGraph]);

  return null;
};

export const LoadGraphWithHook: FC<{ style?: CSSProperties }> = ({ style }) => {
  // function cleanUpHandler() {
  //   localStorage.setItem('uploadedCSV', "");
  //   localStorage.setItem('parsedCSVData', "");
  // }
  return (
    <div>
      <SigmaContainer style={style}>
        <MyGraph />
      </SigmaContainer>
      {/* <button
          className="flex justify-center rounded bg-primary px-6 py-2 font-medium text-gray hover:bg-opacity-90"
          type="submit"
        >
          Clear
        </button> */}
    </div>    
  );
};
