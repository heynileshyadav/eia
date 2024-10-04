import React, { useState } from "react";
import { CKEditor } from "@ckeditor/ckeditor5-react";
import ClassicEditor from "@ckeditor/ckeditor5-build-classic";
import htmlToPdfmake from "html-to-pdfmake";
import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts"; // Add font support for pdfMake
import "bootstrap/dist/css/bootstrap.min.css";

// Register the pdfMake fonts
pdfMake.vfs = pdfFonts.pdfMake.vfs;

const App = () => {
  const [editorContent, setEditorContent] = useState("");

  // Function to extract titles from the content with serial numbers
  const extractTitles = (htmlContent) => {
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = htmlContent;
    const headings = tempDiv.querySelectorAll("h1, h2, h3, h4, h5, h6");
    const titles = [];
    headings.forEach((heading, index) => {
      titles.push({
        text: `${index + 1}. ${heading.innerText}`, // Add serial number
        level: heading.tagName.toLowerCase(), // Get the heading level (h1, h2, etc.)
      });
    });
    return titles;
  };

  const downloadPdf = () => {
    if (editorContent) {
      // Convert HTML to PDFMake content
      const pdfContent = htmlToPdfmake(editorContent, { window });

      // Extract titles for the table of contents
      const titles = extractTitles(editorContent);

      // Adjust the PDF content to ensure tables are full width and properly formatted
      const adjustedPdfContent = pdfContent.map((item) => {
        if (item.table) {
          // Set column widths to be equal or specific widths from the editor
          item.table.widths = new Array(item.table.body[0].length).fill("*");

          // Adjust table layout for better appearance
          item.layout = {
            hLineWidth: () => 0.5,
            vLineWidth: () => 0.5,
            hLineColor: () => "#aaa",
            vLineColor: () => "#aaa",
            paddingLeft: () => 4,
            paddingRight: () => 4,
          };
        }
        return item;
      });

      // Define the PDF document structure with A4 size and margins
      const documentDefinition = {
        content: [
          {
            text: "Table of Contents and Indexing",
            style: "header",
            alignment: "center",
            margin: [0, 20],
          },
          {
            ol: titles.map((title) => ({
              text: title.text, // Title text with serial number
            })),
            margin: [0, 10],
          },
          { text: "", pageBreak: "before" }, // Page break before the main content
          ...adjustedPdfContent, // Include main content without a title
        ],
        pageSize: "A4",
        pageMargins: [40, 60, 40, 60], // Top, Right, Bottom, Left margins
        footer: (currentPage) => {
          return {
            text: `Page ${currentPage}`, // Format as "Page X"
            alignment: "center", // Center align the text
            margin: [0, 10], // Add some margin to the footer
          };
        },
        styles: {
          header: {
            fontSize: 20,
            bold: true,
            margin: [0, 20, 0, 10],
          },
        },
      };

      // Create the PDF
      pdfMake.createPdf(documentDefinition).download("document.pdf");
    } else {
      console.error("Editor content is empty");
    }
  };

  return (
    <div className="container mt-5">
      <h1>Demo</h1>
      <CKEditor
        editor={ClassicEditor}
        data={editorContent}
        onChange={(event, editor) => {
          const data = editor.getData();
          setEditorContent(data); // Save content on change
        }}
        config={{
          toolbar: [
            "heading",
            "|",
            "bold",
            "italic",
            "fontColor",
            "fontBackgroundColor",
            "link",
            "bulletedList",
            "numberedList",
            "blockQuote",
            "insertTable",
            "imageUpload",
            "undo",
            "redo",
          ],
          image: {
            toolbar: [
              "imageTextAlternative",
              "imageStyle:full",
              "imageStyle:side",
            ],
          },
          table: {
            contentToolbar: ["tableColumn", "tableRow", "mergeTableCells"],
          },
        }}
      />
      <button className="btn btn-primary mt-3" onClick={downloadPdf}>
        Download PDF
      </button>
    </div>
  );
};

export default App;
