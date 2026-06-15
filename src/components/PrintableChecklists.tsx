import React from 'react';
import { StudentProject } from '../types';

interface Props {
  project: StudentProject;
  logoUrl?: string;
}

export const PrintStyles = () => (
  <style>
    {`
      .print-only, .print-container { display: none !important; }
      
      @media print {
        @page { margin: 10mm; size: A4; }
        
        body { 
          background: white !important;
          color: black !important;
        }

        /* Hide only truly problematic layout elements */
        aside, nav, header, [role="banner"], [role="navigation"], .no-print {
          display: none !important;
        }

        .print-only, .print-container {
          display: block !important;
          visibility: visible !important;
        }

        .print-only, .print-container {
          display: block !important;
          position: absolute !important;
          left: 0 !important;
          top: 0 !important;
          width: 100% !important;
          margin: 0 !important;
          padding: 0 !important;
          z-index: 9999999 !important;
        }

        .no-print { display: none !important; }
        
        .print-table { 
          width: 100% !important; 
          border-collapse: collapse !important; 
          margin-bottom: 15px !important; 
          table-layout: fixed !important;
        }
        
        .print-table th, .print-table td { 
          border: 1px solid #000 !important; 
          padding: 6px 8px !important; 
          text-align: left !important;
          word-wrap: break-word !important;
        }
        
        .print-table th { background-color: #f0f0f0 !important; font-weight: bold !important; -webkit-print-color-adjust: exact; }
        .print-header { display: flex !important; justify-content: space-between !important; align-items: center !important; margin-bottom: 20px !important; border-bottom: 2px solid #000 !important; padding-bottom: 10px !important; height: 80px !important; }
        .print-title { font-size: 20px !important; font-weight: bold !important; text-align: right !important; flex-grow: 1 !important; }
        .print-logo-container { width: 120px !important; height: 80px !important; display: flex !important; align-items: center !important; justify-content: flex-start !important; }
        .print-meta { display: flex !important; justify-content: space-between !important; gap: 20px !important; margin-bottom: 20px !important; font-size: 11px !important; }
        .print-meta-item { display: flex !important; align-items: baseline !important; gap: 5px !important; }
        
        .print-input-box { 
          border-bottom: 1px solid #000 !important; 
          display: inline-block !important; 
          min-width: 100px !important; 
          min-height: 1.2em !important; 
          vertical-align: bottom !important; 
          margin-left: 5px !important; 
          text-align: center !important;
        }
        
        .print-section-title { 
          background-color: #e0e0e0 !important; 
          font-weight: bold !important; 
          padding: 8px 10px !important; 
          text-align: left !important;
          -webkit-print-color-adjust: exact;
        }
        
        .print-row-num { 
          width: 30px !important; 
          text-align: center !important; 
          font-weight: bold !important; 
        }
        
        .print-check-col { 
          width: 40px !important; 
          text-align: center !important; 
        }
      }
    `}
  </style>
);

export const PreFlightChecklistPrintable = ({ project, logoUrl }: Props) => {
  return (
    <div className="print-container" id="preflight-checklist-printable">
      <div className="print-header">
        <div className="print-logo-container">
          {logoUrl ? (
            <img 
              src={logoUrl} 
              alt="Endless Spark Logo" 
              style={{ maxHeight: '70px', width: 'auto', display: 'block' }}
            />
          ) : (
            <div style={{ fontWeight: 'bold', fontSize: '14px' }}>Endless Spark</div>
          )}
        </div>
        <div className="print-title">
          Pre-Flight Checklist
        </div>
      </div>

      <div className="print-meta" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', fontSize: '12px' }}>
        <div>
          <strong>Project Number:</strong> {project.clientBrief?.projectNumber || project.projectCode || '-'}
        </div>
        <div>
          <strong>Date:</strong> {new Date().toLocaleDateString()}
        </div>
      </div>

      <table className="print-table">
        <thead>
          <tr>
            <th colSpan={2}>Checklist</th>
            <th className="print-check-col">Status</th>
          </tr>
        </thead>
        <tbody>
          {project.preflightChecklist && project.preflightChecklist.length > 0 ? (
            <>
              <tr><td colSpan={3} className="print-section-title">Pre-Flight Review</td></tr>
              {project.preflightChecklist.map((point, idx) => (
                <tr key={idx}>
                  <td className="print-row-num">{idx + 1}</td>
                  <td>{point}</td>
                  <td className="print-check-col text-center font-bold">
                    {project.preflightChecklistProgress?.[idx] === 'Y' && '✓'}
                  </td>
                </tr>
              ))}
            </>
          ) : (
            <tr>
              <td colSpan={3} className="text-center py-4 text-gray-500">
                No pre-flight checklist items available.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export const ProductionArtChecklist = ({ project, logoUrl }: Props) => {
  return (
    <div className="print-container" id="production-art-checklist-printable">
      <div className="print-header">
        <div className="print-logo-container">
          {logoUrl ? (
            <img 
              src={logoUrl} 
              alt="Endless Spark Logo" 
              style={{ maxHeight: '70px', width: 'auto', display: 'block' }}
            />
          ) : (
            <div style={{ fontWeight: 'bold', fontSize: '14px' }}>Endless Spark</div>
          )}
        </div>
        <div className="print-title">
          <div style={{ fontSize: '24px' }}>Production Art Engineer Checklist</div>
          <div style={{ fontSize: '12px', fontWeight: 'normal' }}>Quality Being with Process</div>
        </div>
      </div>

      <div className="print-meta" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', fontSize: '12px' }}>
        <div style={{ display: 'flex', gap: '20px' }}>
          <div><strong>Project Number:</strong> {project.clientBrief?.projectNumber || project.projectCode || '-'}</div>
          <div><strong>Version:</strong> ______</div>
        </div>
        <div>
          <strong>Date:</strong> {new Date().toLocaleDateString()}
        </div>
      </div>

      <table className="print-table">
        <thead>
          <tr>
            <th colSpan={2}>Checklist</th>
            <th className="print-check-col">Y</th>
            <th className="print-check-col">NA</th>
            <th className="print-check-col">Q</th>
          </tr>
        </thead>
        <tbody>
          {project.productionChecklist && project.productionChecklist.length > 0 ? (
            <>
              <tr><td colSpan={5} className="print-section-title">Production Art Engineer QC Checklist</td></tr>
              {project.productionChecklist.map((point, idx) => (
                <tr key={idx}>
                  <td className="print-row-num">{idx + 1}</td>
                  <td>{point}</td>
                  <td className="print-check-col">{project.productionChecklistProgress?.[idx] === 'Y' ? '✓' : ''}</td>
                  <td className="print-check-col">{project.productionChecklistProgress?.[idx] === 'NA' ? '✓' : ''}</td>
                  <td className="print-check-col">{project.productionChecklistProgress?.[idx] === 'Q' ? '✓' : ''}</td>
                </tr>
              ))}
            </>
          ) : (
            <>
              <tr><td colSpan={5} className="print-section-title">Pre-flight</td></tr>
              <tr><td className="print-row-num">1</td><td>Type of Packaging:</td><td className="print-check-col"></td><td className="print-check-col"></td><td className="print-check-col"></td></tr>
              <tr><td className="print-row-num">2</td><td>Artwork Type:</td><td className="print-check-col"></td><td className="print-check-col"></td><td className="print-check-col"></td></tr>
              <tr><td className="print-row-num">3</td><td>Artwork Category:</td><td className="print-check-col"></td><td className="print-check-col"></td><td className="print-check-col"></td></tr>
              <tr><td className="print-row-num">4</td><td>Printing process:</td><td className="print-check-col"></td><td className="print-check-col"></td><td className="print-check-col"></td></tr>
              <tr><td className="print-row-num">5</td><td>Substrate Type:</td><td className="print-check-col"></td><td className="print-check-col"></td><td className="print-check-col"></td></tr>
              <tr><td className="print-row-num">6</td><td>Client approved PDF and ai file from server are same?</td><td className="print-check-col"></td><td className="print-check-col"></td><td className="print-check-col"></td></tr>
              <tr><td className="print-row-num">7</td><td>Check number of colors match with brief</td><td className="print-check-col"></td><td className="print-check-col"></td><td className="print-check-col"></td></tr>
              <tr><td className="print-row-num">8</td><td>Confirm that the supplied AI file and PDF are identical (Check timestamp)</td><td className="print-check-col"></td><td className="print-check-col"></td><td className="print-check-col"></td></tr>
              <tr><td className="print-row-num">9</td><td>Check number of colors match with brief</td><td className="print-check-col"></td><td className="print-check-col"></td><td className="print-check-col"></td></tr>

              <tr><td colSpan={5} className="print-section-title">Instruction</td></tr>
              <tr><td className="print-row-num">1</td><td>Checked Client Provided documents & Brief information?</td><td className="print-check-col"></td><td className="print-check-col"></td><td className="print-check-col"></td></tr>
              <tr><td className="print-row-num">2</td><td>Checked the Print Spec</td><td className="print-check-col"></td><td className="print-check-col"></td><td className="print-check-col"></td></tr>
              <tr><td className="print-row-num">3</td><td>Check Structural Drawing is 1:1</td><td className="print-check-col"></td><td className="print-check-col"></td><td className="print-check-col"></td></tr>
              <tr><td className="print-row-num">4</td><td>Check the Structural Drawing annotation</td><td className="print-check-col"></td><td className="print-check-col"></td><td className="print-check-col"></td></tr>
              <tr><td className="print-row-num">5</td><td>Check Structural Drawing is overprint</td><td className="print-check-col"></td><td className="print-check-col"></td><td className="print-check-col"></td></tr>
              <tr><td className="print-row-num">6</td><td>Variant name, SKU are matching with supplied documents</td><td className="print-check-col"></td><td className="print-check-col"></td><td className="print-check-col"></td></tr>
              <tr><td className="print-row-num">7</td><td>Checked Structural Drawing instruction, Panel orientation and Dimensions</td><td className="print-check-col"></td><td className="print-check-col"></td><td className="print-check-col"></td></tr>
              <tr><td className="print-row-num">8</td><td>Checked Aesthetic of artwork, edited text alignment (good layout and Visibility of elements)</td><td className="print-check-col"></td><td className="print-check-col"></td><td className="print-check-col"></td></tr>
              <tr><td className="print-row-num">9</td><td>Got Confirmation from client for the proactive decisions</td><td className="print-check-col"></td><td className="print-check-col"></td><td className="print-check-col"></td></tr>
              <tr><td className="print-row-num">10</td><td>Consistency of brand across region is consider</td><td className="print-check-col"></td><td className="print-check-col"></td><td className="print-check-col"></td></tr>
              <tr><td className="print-row-num">11</td><td>Replicate the elements properly</td><td className="print-check-col"></td><td className="print-check-col"></td><td className="print-check-col"></td></tr>
              <tr><td className="print-row-num">12</td><td>Design tool box followed in artwork (Guide line particular artwork)</td><td className="print-check-col"></td><td className="print-check-col"></td><td className="print-check-col"></td></tr>
              <tr><td className="print-row-num">13</td><td>Checked for the 'Online coding area size, position and color</td><td className="print-check-col"></td><td className="print-check-col"></td><td className="print-check-col"></td></tr>
              <tr><td className="print-row-num">14</td><td>Spell-check done, Superscript and Subscript are corrected</td><td className="print-check-col"></td><td className="print-check-col"></td><td className="print-check-col"></td></tr>

              <tr><td colSpan={5} className="print-section-title">Code</td></tr>
              <tr><td className="print-row-num">1</td><td>Check the barcode information match with Brief</td><td className="print-check-col"></td><td className="print-check-col"></td><td className="print-check-col"></td></tr>
              <tr><td className="print-row-num">2</td><td>QR or Data matrices code match with Brief</td><td className="print-check-col"></td><td className="print-check-col"></td><td className="print-check-col"></td></tr>

              <tr><td colSpan={5} className="print-section-title">Mandate</td></tr>
              <tr><td className="print-row-num">1</td><td>Checked Legal requirement updated</td><td className="print-check-col"></td><td className="print-check-col"></td><td className="print-check-col"></td></tr>
              <tr><td className="print-row-num">2</td><td>Check Brand Guideline followed Artwork</td><td className="print-check-col"></td><td className="print-check-col"></td><td className="print-check-col"></td></tr>

              <tr><td colSpan={5} className="print-section-title">Illustrator</td></tr>
              <tr><td className="print-row-num">1</td><td>Check document raster setting in 300 dpi</td><td className="print-check-col"></td><td className="print-check-col"></td><td className="print-check-col"></td></tr>
              <tr><td className="print-row-num">2</td><td>Check layer content are correct and Artboard outside elements are remove.</td><td className="print-check-col"></td><td className="print-check-col"></td><td className="print-check-col"></td></tr>
              <tr><td className="print-row-num">3</td><td>Check layer name and structure are correct.</td><td className="print-check-col"></td><td className="print-check-col"></td><td className="print-check-col"></td></tr>
              <tr><td className="print-row-num">4</td><td>Check embedded links. Swatches name / Colour as per std.</td><td className="print-check-col"></td><td className="print-check-col"></td><td className="print-check-col"></td></tr>
              <tr><td className="print-row-num">5</td><td>Checked the unwanted Swatches, Barcode, Brush, Style appearance</td><td className="print-check-col"></td><td className="print-check-col"></td><td className="print-check-col"></td></tr>
              <tr><td className="print-row-num">6</td><td>Check process colour in ink-manager & Ink manager setting.</td><td className="print-check-col"></td><td className="print-check-col"></td><td className="print-check-col"></td></tr>
              <tr><td className="print-row-num">7</td><td>Checked for the updating of non-visible stations and Thumbnail Updated</td><td className="print-check-col"></td><td className="print-check-col"></td><td className="print-check-col"></td></tr>

              <tr><td colSpan={5} className="print-section-title">Barcode</td></tr>
              <tr>
                <td className="print-row-num">1</td>
                <td>
                  Check barcode number match with brief<br/>
                  Colour <span className="print-input-box" style={{width: '60px'}}></span> &nbsp;
                  Type <span className="print-input-box" style={{width: '60px'}}></span> &nbsp;
                  Magnification <span className="print-input-box" style={{width: '60px'}}></span> &nbsp;
                  BWR <span className="print-input-box" style={{width: '60px'}}></span>
                </td>
                <td className="print-check-col"></td>
              </tr>

              <tr><td colSpan={3} className="print-section-title">Eye mark</td></tr>
              <tr>
                <td className="print-row-num">1</td>
                <td>
                  Check eye mark<br/>
                  Position <span className="print-input-box" style={{width: '60px'}}></span> &nbsp;
                  Colour <span className="print-input-box" style={{width: '60px'}}></span> &nbsp;
                  Size <span className="print-input-box" style={{width: '60px'}}></span> &nbsp;
                  Dimension <span className="print-input-box" style={{width: '60px'}}></span>
                </td>
                <td className="print-check-col"></td>
              </tr>

              <tr><td colSpan={3} className="print-section-title">Image</td></tr>
              <tr><td className="print-row-num">1</td><td>Checked the Link file name</td><td className="print-check-col"></td></tr>
              <tr><td className="print-row-num">2</td><td>Checked the color mode in CMYK</td><td className="print-check-col"></td></tr>
              <tr><td className="print-row-num">3</td><td>Checked the Resolution of the image is above 300 dpi</td><td className="print-check-col"></td></tr>
              <tr><td className="print-row-num">4</td><td>Checked 1:1 link used in artwork</td><td className="print-check-col"></td></tr>
              <tr><td className="print-row-num">5</td><td>Checked the Link path (all should be from respective folder)</td><td className="print-check-col"></td></tr>

              <tr><td colSpan={3} className="print-section-title">Compare</td></tr>
              <tr><td className="print-row-num">1</td><td>Checked in animation and difference mode in 400% zoom level (Base Compare)</td><td className="print-check-col"></td></tr>
              <tr><td className="print-row-num">2</td><td>Element Compare (Tiled the documents and compared all elements for ED Change or Different SKU)</td><td className="print-check-col"></td></tr>
              <tr><td className="print-row-num">3</td><td>Checked with range compare</td><td className="print-check-col"></td></tr>
              <tr><td className="print-row-num">4</td><td>Checked ED Compare</td><td className="print-check-col"></td></tr>
              <tr><td className="print-row-num">9</td><td>Check Common plate</td><td className="print-check-col"></td></tr>

              <tr><td colSpan={3} className="print-section-title">Printer Spec</td></tr>
              <tr><td className="print-row-num">1</td><td>Check line thickness pos / neg</td><td className="print-check-col"></td></tr>
              <tr><td className="print-row-num">2</td><td>Check Min. text size pos / rev [pt]</td><td className="print-check-col"></td></tr>
              <tr><td className="print-row-num">3</td><td>Bleed, Rollover and Type Safety</td><td className="print-check-col"></td></tr>
              <tr><td className="print-row-num">4</td><td>Min. dot size on file</td><td className="print-check-col"></td></tr>
              <tr><td className="print-row-num">5</td><td>Check Finishing operation separation match with design file</td><td className="print-check-col"></td></tr>

              <tr><td colSpan={3} className="print-section-title">Legend</td></tr>
              <tr><td className="print-row-num">1</td><td>Check number of Color and Colour Sequence</td><td className="print-check-col"></td></tr>
              <tr><td className="print-row-num">2</td><td>General and Technical information match with Brief</td><td className="print-check-col"></td></tr>
            </>
          )}

          <tr>
            <td colSpan={3} style={{ padding: '30px 20px', display: 'flex', justifyContent: 'space-between' }}>
              <div>Artist Signature: _______________________</div>
              <div>PA initial: _______________________</div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export const QcProductionArtChecklistPrintable = ({ project, logoUrl }: Props) => {
  const qcData = (project as any).qcProduction || {};

  const SECTIONS = {
    preflight: [
      "Client Annotation PDF and Supplied PDF are same?",
      "Confirm that the supplied AI file and PDF are identical (Server) (Check timestamp)",
      "Ensure variant name, net weight, matching design file, and brief information."
    ],
    instruction: [
      "Checked Client Provided documents & Brief information?",
      "Checked the Print Spec",
      "Check Structural Drawing is 1:1",
      "Check the Structural Drawing annotation",
      "Check Structural Drawing is overprint",
      "Variant name, SKU are matching with supplied documents",
      "Checked Structural Drawing instruction, Panel orientation and Dimensions",
      "Checked Aesthetic of artwork, edited text alignment (good layout and Visibility of elements)",
      "Got Confirmation from client for the proactive decisions",
      "Consistency of brand across region is consider",
      "Replicate the elements properly Place Etach Panel",
      "Brand Guideline followed in artwork (Guideline particular artwork)",
      "Checked for the 'Online Coding area size, Position and Color",
      "Spell-check done, Superscript and Subscript are corrected"
    ],
    code: [
      "Check the barcode information match with Brief",
      "QR or Data matrices code match with Brief"
    ],
    mandate: [
      "Checked Legal requirement updated",
      "Check Brand Guideline followed Artwork"
    ],
    illustrator: [
      "Check document raster setting in 300 dpi",
      "Check layer content are correct and Artboard outside elements are remove.",
      "Check layer name and structure are correct.",
      "Check embedded links. Swatches name / Colour as per std.",
      "Checked the unwanted Swatches, Barcode, Brush, Style appearance",
      "Check process colour in ink-manager & Ink manager setting.",
      "Checked for the updating of non-visible stations and Thumbnail Updated"
    ],
    image: [
      "Checked the Link file name",
      "Checked the color mode in CMYK",
      "Checked the Resolution of the image is above 300 dpi",
      "Checked 1:1 link used in artwork",
      "Checked the Link path (all should be from respective folder)"
    ],
    compare: [
      "Checked in animation and difference mode in 400% zoom level (Base Compare)",
      "Element Compare (Tiled the documents and compared all elements for ED Change or Different SKU)",
      "Checked with range compare",
      "Checked ED Compare",
      "Check Common plate"
    ],
    printerSpec: [
      "Check line thickness pos / neg",
      "Check Min. text size pos / rev [pt]",
      "Bleed, Rollover and Type Safety",
      "Min. dot size on file",
      "Check Finishing operation separation match with design file"
    ],
    legend: [
      "Check number of Color and Colour Sequence",
      "General and Technical information match with Brief",
      "Color Sequence Match with Brief"
    ]
  };

  const getStatusChar = (section: string, idx: number) => {
    const status = qcData[section]?.[idx];
    if (status === 'yes') return 'Y';
    if (status === 'no') return 'N';
    if (status === 'na') return 'NA';
    if (status === 'query') return 'Q';
    if (status === 'rework') return 'REWORK';
    return '-';
  };

  return (
    <div className="print-container" id="qc-production-checklist-printable">
      <div className="print-header">
        <div className="print-logo-container">
          {logoUrl ? (
            <img 
              src={logoUrl} 
              alt="Endless Spark Logo" 
              style={{ maxHeight: '70px', width: 'auto', display: 'block' }}
            />
          ) : (
            <div style={{ fontWeight: 'bold', fontSize: '14px' }}>Endless Spark</div>
          )}
        </div>
        <div className="print-title">
          <div style={{ fontSize: '24px' }}>QC Production Art Checklist</div>
          <div style={{ fontSize: '12px', fontWeight: 'normal' }}>QC Quality Signoff Verification</div>
        </div>
      </div>

      <div className="print-meta" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', fontSize: '12px' }}>
        <div style={{ display: 'flex', gap: '20px' }}>
          <div><strong>Project Number:</strong> {project.clientBrief?.projectNumber || project.projectCode || '-'}</div>
          <div><strong>Student Artist:</strong> {project.studentName || '-'}</div>
        </div>
        <div>
          <strong>Verification Date:</strong> {new Date().toLocaleDateString()}
        </div>
      </div>

      <table className="print-table">
        <thead>
          <tr>
            <th colSpan={2}>Checklist Point</th>
            <th className="print-check-col" style={{ width: '80px', textAlign: 'center' }}>QC Status</th>
          </tr>
        </thead>
        <tbody>
          <tr><td colSpan={3} className="print-section-title">Pre-flight</td></tr>
          {SECTIONS.preflight.map((point, idx) => (
            <tr key={`pre-${idx}`}>
              <td className="print-row-num">{idx + 1}</td>
              <td>{point}</td>
              <td className="print-check-col text-center font-bold">{getStatusChar('preflight', idx)}</td>
            </tr>
          ))}

          <tr><td colSpan={3} className="print-section-title">Instruction</td></tr>
          {SECTIONS.instruction.map((point, idx) => (
            <tr key={`inst-${idx}`}>
              <td className="print-row-num">{idx + 1}</td>
              <td>{point}</td>
              <td className="print-check-col text-center font-bold">{getStatusChar('instruction', idx)}</td>
            </tr>
          ))}

          <tr><td colSpan={3} className="print-section-title">Code</td></tr>
          {SECTIONS.code.map((point, idx) => (
            <tr key={`code-${idx}`}>
              <td className="print-row-num">{idx + 1}</td>
              <td>{point}</td>
              <td className="print-check-col text-center font-bold">{getStatusChar('code', idx)}</td>
            </tr>
          ))}

          <tr><td colSpan={3} className="print-section-title">Mandate</td></tr>
          {SECTIONS.mandate.map((point, idx) => (
            <tr key={`mand-${idx}`}>
              <td className="print-row-num">{idx + 1}</td>
              <td>{point}</td>
              <td className="print-check-col text-center font-bold">{getStatusChar('mandate', idx)}</td>
            </tr>
          ))}

          <tr><td colSpan={3} className="print-section-title">Illustrator</td></tr>
          {SECTIONS.illustrator.map((point, idx) => (
            <tr key={`ill-${idx}`}>
              <td className="print-row-num">{idx + 1}</td>
              <td>{point}</td>
              <td className="print-check-col text-center font-bold">{getStatusChar('illustrator', idx)}</td>
            </tr>
          ))}

          <tr><td colSpan={3} className="print-section-title">Barcode</td></tr>
          <tr>
            <td className="print-row-num">1</td>
            <td>
              Check barcode number match with brief (
              Colour: {qcData.barcode?.colour ? 'YES' : 'NO'}, 
              Type: {qcData.barcode?.type ? 'YES' : 'NO'}, 
              Magnification: {qcData.barcode?.magnification ? 'YES' : 'NO'}, 
              BWR: {qcData.barcode?.bwr ? 'YES' : 'NO'}
              )
            </td>
            <td className="print-check-col text-center font-bold">{qcData.barcode?.status?.toUpperCase() || '-'}</td>
          </tr>

          <tr><td colSpan={3} className="print-section-title">Eye mark</td></tr>
          <tr>
            <td className="print-row-num">1</td>
            <td>
              Check eye mark (
              Position: {qcData.eyeMark?.position ? 'YES' : 'NO'}, 
              Colour: {qcData.eyeMark?.colour ? 'YES' : 'NO'}, 
              Size: {qcData.eyeMark?.size ? 'YES' : 'NO'}, 
              Dimension: {qcData.eyeMark?.dimension ? 'YES' : 'NO'}
              )
            </td>
            <td className="print-check-col text-center font-bold">{qcData.eyeMark?.status?.toUpperCase() || '-'}</td>
          </tr>

          <tr><td colSpan={3} className="print-section-title">Image</td></tr>
          {SECTIONS.image.map((point, idx) => (
            <tr key={`img-${idx}`}>
              <td className="print-row-num">{idx + 1}</td>
              <td>{point}</td>
              <td className="print-check-col text-center font-bold">{getStatusChar('image', idx)}</td>
            </tr>
          ))}

          <tr><td colSpan={3} className="print-section-title">Compare</td></tr>
          {SECTIONS.compare.map((point, idx) => (
            <tr key={`comp-${idx}`}>
              <td className="print-row-num">{idx + 1}</td>
              <td>{point}</td>
              <td className="print-check-col text-center font-bold">{getStatusChar('compare', idx)}</td>
            </tr>
          ))}

          <tr><td colSpan={3} className="print-section-title">Printer Spec</td></tr>
          {SECTIONS.printerSpec.map((point, idx) => (
            <tr key={`spec-${idx}`}>
              <td className="print-row-num">{idx + 1}</td>
              <td>{point}</td>
              <td className="print-check-col text-center font-bold">{getStatusChar('printerSpec', idx)}</td>
            </tr>
          ))}

          <tr><td colSpan={3} className="print-section-title">Legend</td></tr>
          {SECTIONS.legend.map((point, idx) => (
            <tr key={`leg-${idx}`}>
              <td className="print-row-num">{idx + 1}</td>
              <td>{point}</td>
              <td className="print-check-col text-center font-bold">{getStatusChar('legend', idx)}</td>
            </tr>
          ))}

          <tr>
            <td colSpan={3} style={{ padding: '30px 20px', display: 'flex', justifyContent: 'space-between' }}>
              <div>QC Officer Signature: _______________________</div>
              <div>Signoff Status: APPROVED / REJECTED</div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export const ClientBriefPrintable = ({ project, logoUrl }: Props) => {
  return (
    <div className="print-container w-full" id="client-brief-printable" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
      <div className="print-header flex items-center justify-between mb-4">
        <div className="print-logo-container">
          {logoUrl ? (
            <img 
              src={logoUrl} 
              alt="Endless Spark Logo" 
              style={{ maxHeight: '70px', width: 'auto', display: 'block' }}
            />
          ) : (
            <div style={{ fontWeight: 'bold', fontSize: '14px' }}>Endless Spark</div>
          )}
        </div>
        <div className="print-title font-bold" style={{ fontSize: '24px' }}>
          Client Brief & Printer Specification
        </div>
      </div>

      <div className="print-meta flex justify-between mb-4 text-xs">
        <div className="flex gap-4">
          <div><strong>Project Number:</strong> {project.clientBrief?.projectNumber || project.projectCode || '-'}</div>
          <div><strong>Project:</strong> {project.title}</div>
        </div>
        <div>
          <strong>Date:</strong> {new Date().toLocaleDateString()}
        </div>
      </div>

      <div className="overflow-x-auto w-full mb-6">
        <table className="w-full border-collapse border-2 border-black text-xs text-left table-fixed">
          <colgroup>
            <col className="w-[16.66%]" />
            <col className="w-[16.66%]" />
            <col className="w-[16.66%]" />
            <col className="w-[16.66%]" />
            <col className="w-[16.66%]" />
            <col className="w-[16.66%]" />
          </colgroup>
          <tbody>
            {/* General Settings */}
            <tr>
              <th colSpan={6} className="border border-black bg-white p-2 text-center font-bold text-sm">General Settings</th>
            </tr>
            <tr>
              <td colSpan={1} className="border border-black p-2 bg-white">Project Title</td>
              <td colSpan={5} className="border border-black p-2 bg-[#e6eeff] font-medium">{project.title || '-'}</td>
            </tr>
            <tr>
              <td colSpan={1} className="border border-black p-2 bg-white">Course</td>
              <td colSpan={3} className="border border-black p-2 bg-[#e6eeff] font-medium">{project.courseName || '-'}</td>
              <td colSpan={1} className="border border-black p-2 bg-white">Est. Time</td>
              <td colSpan={1} className="border border-black p-2 bg-[#e6eeff] font-medium">{project.estimatedTime ? `${project.estimatedTime} minutes` : '-'}</td>
            </tr>
            <tr>
              <td colSpan={1} className="border border-black p-2 bg-white align-top">Project Details</td>
              <td colSpan={5} className="border border-black p-2 bg-[#e6eeff] font-medium whitespace-pre-wrap">{project.details || '-'}</td>
            </tr>

            {/* Client Brief */}
            {project.clientBrief && (
              <>
                <tr>
                  <th colSpan={6} className="border border-black bg-white p-2 text-center font-bold text-sm">Client Brief</th>
                </tr>
                <tr>
                  <td colSpan={1} className="border border-black p-2 bg-white">Brand Name</td>
                  <td colSpan={2} className="border border-black p-2 bg-[#e6eeff] font-medium">{project.clientBrief.brandName || '-'}</td>
                  <td colSpan={1} className="border border-black p-2 bg-white">Pack Type</td>
                  <td colSpan={2} className="border border-black p-2 bg-[#e6eeff] font-medium">{project.clientBrief.packType || '-'}</td>
                </tr>
                <tr>
                  <td colSpan={1} className="border border-black p-2 bg-white">Project Number</td>
                  <td colSpan={2} className="border border-black p-2 bg-[#e6eeff] font-medium">
                    {project.clientBrief.projectNumber || (project.studentId ? 'Not available (Old format)' : '[Auto-generated per student]')}
                  </td>
                  <td colSpan={1} className="border border-black p-2 bg-white">Variant Name</td>
                  <td colSpan={2} className="border border-black p-2 bg-[#e6eeff] font-medium">{project.clientBrief.variantName || '-'}</td>
                </tr>
                <tr>
                  <td colSpan={1} className="border border-black p-2 bg-white">Net Weight</td>
                  <td colSpan={2} className="border border-black p-2 bg-[#e6eeff] font-medium">{project.clientBrief.netWeight || '-'}</td>
                  <td colSpan={1} className="border border-black p-2 bg-white">Base File Name</td>
                  <td colSpan={2} className="border border-black p-2 bg-[#e6eeff] font-medium">{project.clientBrief.baseFileName || '-'}</td>
                </tr>
                <tr>
                  <td colSpan={1} className="border border-black p-2 bg-white">ED Name</td>
                  <td colSpan={2} className="border border-black p-2 bg-[#e6eeff] font-medium">{project.clientBrief.edName || '-'}</td>
                  <td colSpan={1} className="border border-black p-2 bg-white">Reference File Name</td>
                  <td colSpan={2} className="border border-black p-2 bg-[#e6eeff] font-medium">{project.clientBrief.referenceFileName || '-'}</td>
                </tr>
                <tr>
                  <td colSpan={1} className="border border-black p-2 bg-white">Master Job</td>
                  <td colSpan={2} className="border border-black p-2 bg-[#e6eeff] font-medium">{project.clientBrief.masterJob || '-'}</td>
                  <td colSpan={1} className="border border-black p-2 bg-white">Annotation PDF Name</td>
                  <td colSpan={2} className="border border-black p-2 bg-[#e6eeff] font-medium">{project.clientBrief.annotationPdfName || '-'}</td>
                </tr>
                <tr>
                  <td colSpan={1} className="border border-black p-2 bg-white">File Name (Auto)</td>
                  <td colSpan={5} className="border border-black p-2 bg-[#e6eeff] font-medium">{project.clientBrief.fileName || '-'}</td>
                </tr>
                <tr>
                  <td colSpan={1} className="border border-black p-2 bg-white align-top">Job Brief</td>
                  <td colSpan={5} className="border border-black p-2 bg-[#e6eeff] font-medium whitespace-pre-wrap">{project.clientBrief.jobBrief || '-'}</td>
                </tr>
              </>
            )}
          </tbody>
        </table>
      </div>

      {project.printerSpec?.barcodes && project.printerSpec.barcodes.length > 0 && (
        <div className="mb-6 break-inside-avoid w-full">
          <table className="w-full border-collapse border-2 border-black text-xs text-left">
            <thead>
              <tr>
                <th colSpan={6} className="border border-black bg-white p-2 text-center font-bold text-sm">Barcodes</th>
              </tr>
              <tr className="bg-gray-100">
                <th className="border border-black p-2 bg-white font-bold text-center">Code Type</th>
                <th className="border border-black p-2 bg-white font-bold text-center">Code Number</th>
                <th className="border border-black p-2 bg-white font-bold text-center">Code Color</th>
                <th className="border border-black p-2 bg-white font-bold text-center">BWR</th>
                <th className="border border-black p-2 bg-white font-bold text-center">Mag.</th>
                <th className="border border-black p-2 bg-white font-bold text-center">Narrow Bar</th>
              </tr>
            </thead>
            <tbody>
              {project.printerSpec.barcodes.map((bc: any, i: number) => (
                <tr key={i}>
                  <td className="border border-black p-2 bg-white">{bc.codeType || '-'}</td>
                  <td className="border border-black p-2 bg-[#e6eeff]">{bc.codeNumber || '-'}</td>
                  <td className="border border-black p-2 bg-white">{bc.codeColour || '-'}</td>
                  <td className="border border-black p-2 bg-[#e6eeff]">{bc.bwr || '-'}</td>
                  <td className="border border-black p-2 bg-white">{bc.magnification || '-'}</td>
                  <td className="border border-black p-2 bg-[#e6eeff]">{bc.narrowBar || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {project.printerSpec?.colorRotation && project.printerSpec.colorRotation.length > 0 && (
        <div className="mb-6 break-inside-avoid w-full">
          <table className="w-full border-collapse border-2 border-black text-xs text-left">
            <thead>
              <tr>
                <th colSpan={6} className="border border-black bg-white p-2 text-center font-bold text-sm">Color Rotation Details</th>
              </tr>
              <tr className="bg-gray-100">
                <th className="border border-black p-2 bg-white font-bold text-center">Color Name</th>
                <th className="border border-black p-2 bg-white font-bold text-center">Line/Screen</th>
                <th className="border border-black p-2 bg-white font-bold text-center">LPI</th>
                <th className="border border-black p-2 bg-white font-bold text-center">Dot Type</th>
                <th className="border border-black p-2 bg-white font-bold text-center">Angle</th>
                <th className="border border-black p-2 bg-white font-bold text-center">New</th>
              </tr>
            </thead>
            <tbody>
              {project.printerSpec.colorRotation.map((cr: any, i: number) => (
                <tr key={i}>
                  <td className="border border-black p-2 bg-[#e6eeff] font-medium">{cr.colorName || '-'}</td>
                  <td className="border border-black p-2 bg-white">{cr.lineScreen || '-'}</td>
                  <td className="border border-black p-2 bg-[#e6eeff]">{cr.lpi || '-'}</td>
                  <td className="border border-black p-2 bg-white">{cr.dotType || '-'}</td>
                  <td className="border border-black p-2 bg-[#e6eeff]">{cr.angle || '-'}</td>
                  <td className="border border-black p-2 bg-white">{cr.new || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {project.printerSpec && (
        <div className="overflow-x-auto w-full mb-6">
          <table className="w-full border-collapse border-2 border-black text-xs text-left table-fixed">
            <colgroup>
              <col className="w-[16.66%]" />
              <col className="w-[16.66%]" />
              <col className="w-[16.66%]" />
              <col className="w-[16.66%]" />
              <col className="w-[16.66%]" />
              <col className="w-[16.66%]" />
            </colgroup>
            <tbody>
              {/* Printer Specification (Basic) */}
              <tr>
                <th colSpan={6} className="border border-black bg-white p-2 text-center font-bold text-sm">Printer Specification</th>
              </tr>
              <tr>
                <td colSpan={1} className="border border-black p-2 bg-white">Printer Name</td>
                <td colSpan={5} className="border border-black p-2 bg-[#e6eeff] font-medium">{project.printerSpec.printerName || '-'}</td>
              </tr>
              <tr>
                <td colSpan={1} className="border border-black p-2 bg-white">Print Method</td>
                <td colSpan={2} className="border border-black p-2 bg-[#e6eeff] font-medium">{project.printerSpec.printMethod || '-'}</td>
                <td colSpan={1} className="border border-black p-2 bg-white">Substrate</td>
                <td colSpan={2} className="border border-black p-2 bg-[#e6eeff] font-medium">{project.printerSpec.printingSubstrate || '-'}</td>
              </tr>
              <tr>
                <td colSpan={1} className="border border-black p-2 bg-white">Face/Reverse</td>
                <td colSpan={2} className="border border-black p-2 bg-[#e6eeff] font-medium">{project.printerSpec.faceReversePrint || '-'}</td>
                <td colSpan={1} className="border border-black p-2 bg-white">Max Colors</td>
                <td colSpan={2} className="border border-black p-2 bg-[#e6eeff] font-medium">{project.printerSpec.maxColors || '-'}</td>
              </tr>
              <tr>
                <td colSpan={1} className="border border-black p-2 bg-white">Varnish</td>
                <td colSpan={2} className="border border-black p-2 bg-[#e6eeff] font-medium">{project.printerSpec.varnishIncluded || '-'}</td>
                <td colSpan={3} className="border border-black p-2 bg-white"></td>
              </tr>
              
              {/* Artwork Information */}
              {project.printerSpec.artworkInfo && (
                <>
                  <tr>
                    <th colSpan={6} className="border border-black bg-white p-2 text-center font-bold text-sm">Artwork Information</th>
                  </tr>
                  <tr>
                    <td colSpan={2} className="border border-black p-2 bg-white">Min. line thickness pos - [MM]</td>
                    <td colSpan={1} className="border border-black p-2 bg-[#e6eeff] font-medium">{project.printerSpec.artworkInfo.minLineThicknessPos || ''}</td>
                    <td colSpan={2} className="border border-black p-2 bg-white">Min. line thickness rev [MM]</td>
                    <td colSpan={1} className="border border-black p-2 bg-[#e6eeff] font-medium">{project.printerSpec.artworkInfo.minLineThicknessRev || ''}</td>
                  </tr>
                  <tr>
                    <td colSpan={2} className="border border-black p-2 bg-white">Min. text size pos. [pt]</td>
                    <td colSpan={1} className="border border-black p-2 bg-[#e6eeff] font-medium">{project.printerSpec.artworkInfo.minTextSizePos || ''}</td>
                    <td colSpan={2} className="border border-black p-2 bg-white">Min. text size rev. [pt]</td>
                    <td colSpan={1} className="border border-black p-2 bg-[#e6eeff] font-medium">{project.printerSpec.artworkInfo.minTextSizeRev || ''}</td>
                  </tr>
                  <tr>
                    <td colSpan={2} className="border border-black p-2 bg-white">Min Type Multi-Color Positive</td>
                    <td colSpan={1} className="border border-black p-2 bg-[#e6eeff] font-medium">{project.printerSpec.artworkInfo.minTypeMultiColorPos || ''}</td>
                    <td colSpan={2} className="border border-black p-2 bg-white">Min Type Multi-Color Reverse</td>
                    <td colSpan={1} className="border border-black p-2 bg-[#e6eeff] font-medium">{project.printerSpec.artworkInfo.minTypeMultiColorRev || ''}</td>
                  </tr>
                  <tr>
                    <td colSpan={2} className="border border-black p-2 bg-white">Minimum symbol Size pos. [pt]</td>
                    <td colSpan={1} className="border border-black p-2 bg-[#e6eeff] font-medium">{project.printerSpec.artworkInfo.minSymbolSizePos || ''}</td>
                    <td colSpan={2} className="border border-black p-2 bg-white">Minimum symbol Size neg. [pt]</td>
                    <td colSpan={1} className="border border-black p-2 bg-[#e6eeff] font-medium">{project.printerSpec.artworkInfo.minSymbolSizeNeg || ''}</td>
                  </tr>
                  <tr>
                    <td colSpan={2} className="border border-black p-2 bg-white">x-height</td>
                    <td colSpan={1} className="border border-black p-2 bg-[#e6eeff] font-medium">{project.printerSpec.artworkInfo.xHeight || ''}</td>
                    <td colSpan={2} className="border border-black p-2 bg-white"></td>
                    <td colSpan={1} className="border border-black p-0 bg-white"></td>
                  </tr>
                  <tr>
                    <td colSpan={1} className="border border-black p-2 bg-white">Bleed</td>
                    <td colSpan={1} className="border border-black p-2 bg-[#e6eeff] font-medium">{project.printerSpec.artworkInfo.bleed || ''}</td>
                    <td colSpan={1} className="border border-black p-2 bg-white">Rollover</td>
                    <td colSpan={1} className="border border-black p-2 bg-[#e6eeff] font-medium">{project.printerSpec.artworkInfo.rollover || ''}</td>
                    <td colSpan={1} className="border border-black p-2 bg-white">Type Safety</td>
                    <td colSpan={1} className="border border-black p-2 bg-[#e6eeff] font-medium">{project.printerSpec.artworkInfo.typeSafety || ''}</td>
                  </tr>
                  <tr>
                    <td colSpan={2} className="border border-black p-2 bg-white">Min. dot size on file [%]</td>
                    <td colSpan={1} className="border border-black p-2 bg-[#e6eeff] font-medium">{project.printerSpec.artworkInfo.minDotSize || ''}</td>
                    <td colSpan={2} className="border border-black p-2 bg-white">Max. Tonal value in gradient</td>
                    <td colSpan={1} className="border border-black p-2 bg-[#e6eeff] font-medium">{project.printerSpec.artworkInfo.maxTonalValue || ''}</td>
                  </tr>
                  <tr>
                    <td colSpan={2} className="border border-black p-2 bg-white">Max. Ink coverage</td>
                    <td colSpan={1} className="border border-black p-2 bg-[#e6eeff] font-medium">{project.printerSpec.artworkInfo.maxInkCoverage || ''}</td>
                    <td colSpan={2} className="border border-black p-2 bg-white"></td>
                    <td colSpan={1} className="border border-black p-0 bg-white"></td>
                  </tr>
                </>
              )}

              {/* Eye mark */}
              {project.printerSpec.eyeMark && (
                <>
                  <tr>
                    <th colSpan={6} className="border border-black bg-white p-2 text-center font-bold text-sm">Eye mark</th>
                  </tr>
                  <tr>
                    <td colSpan={1} className="border border-black p-2 bg-white">Eye Mark size</td>
                    <td colSpan={1} className="border border-black p-2 bg-[#e6eeff] font-medium">{project.printerSpec.eyeMark.size || ''}</td>
                    <td colSpan={2} className="border border-black p-2 bg-white">Eye Mark Colour(exp)</td>
                    <td colSpan={2} className="border border-black p-2 bg-[#e6eeff] font-medium">{project.printerSpec.eyeMark.colour || ''}</td>
                  </tr>
                  <tr>
                    <td colSpan={1} className="border border-black p-2 bg-white">Eye Mark Position</td>
                    <td colSpan={1} className="border border-black p-2 bg-[#e6eeff] font-medium">{project.printerSpec.eyeMark.position || ''}</td>
                    <td colSpan={2} className="border border-black p-2 bg-white">Eye Mark under colour pullback</td>
                    <td colSpan={2} className="border border-black p-2 bg-[#e6eeff] font-medium">{project.printerSpec.eyeMark.underColourPullback || ''}</td>
                  </tr>
                </>
              )}

              {/* Microdot */}
              {project.printerSpec.microdot && (
                <>
                  <tr>
                    <th colSpan={6} className="border border-black bg-white p-2 text-center font-bold text-sm">Microdot</th>
                  </tr>
                  <tr>
                    <td colSpan={1} className="border border-black p-2 bg-white">Location</td>
                    <td colSpan={1} className="border border-black p-2 bg-[#e6eeff] font-medium">{project.printerSpec.microdot.location1 || ''}</td>
                    <td colSpan={1} className="border border-black p-2 bg-white">Location</td>
                    <td colSpan={1} className="border border-black p-2 bg-[#e6eeff] font-medium">{project.printerSpec.microdot.location2 || ''}</td>
                    <td colSpan={1} className="border border-black p-2 bg-white">Microdot Size</td>
                    <td colSpan={1} className="border border-black p-2 bg-[#e6eeff] font-medium">{project.printerSpec.microdot.size || ''}</td>
                  </tr>
                </>
              )}

              {/* Rich Black */}
              {project.printerSpec.richBlack && (
                <>
                  <tr>
                    <th colSpan={6} className="border border-black bg-white p-2 text-center font-bold text-sm">Rich Black</th>
                  </tr>
                  <tr>
                    <td colSpan={1} className="border border-black p-2 bg-white">Cyan</td>
                    <td colSpan={1} className="border border-black p-2 bg-[#e6eeff] font-medium">{project.printerSpec.richBlack.cyan || ''}</td>
                    <td colSpan={1} className="border border-black p-2 bg-white">Yellow</td>
                    <td colSpan={1} className="border border-black p-2 bg-[#e6eeff] font-medium">{project.printerSpec.richBlack.yellow || ''}</td>
                    <td colSpan={1} className="border border-black p-2 bg-white">Magenta</td>
                    <td colSpan={1} className="border border-black p-2 bg-[#e6eeff] font-medium">{project.printerSpec.richBlack.magenta || ''}</td>
                  </tr>
                  <tr>
                    <td colSpan={1} className="border border-black p-2 bg-white">Black</td>
                    <td colSpan={1} className="border border-black p-2 bg-[#e6eeff] font-medium">{project.printerSpec.richBlack.black || ''}</td>
                    <td colSpan={1} className="border border-black p-2 bg-white"></td>
                    <td colSpan={1} className="border border-black p-0 bg-white"></td>
                    <td colSpan={1} className="border border-black p-2 bg-white"></td>
                    <td colSpan={1} className="border border-black p-0 bg-white"></td>
                  </tr>
                </>
              )}

              {/* Trapping/Bleed */}
              {project.printerSpec.trappingBleed && (
                <>
                  <tr>
                    <th colSpan={6} className="border border-black bg-white p-2 text-center font-bold text-sm">Trapping/Bleed</th>
                  </tr>
                  <tr>
                    <td colSpan={1} className="border border-black p-2 bg-white">Minimum Trap</td>
                    <td colSpan={1} className="border border-black p-2 bg-[#e6eeff] font-medium">{project.printerSpec.trappingBleed.minTrap || ''}</td>
                    <td colSpan={1} className="border border-black p-2 bg-white">Maximum Trap</td>
                    <td colSpan={1} className="border border-black p-2 bg-[#e6eeff] font-medium">{project.printerSpec.trappingBleed.maxTrap || ''}</td>
                    <td colSpan={1} className="border border-black p-2 bg-white">Standard Trap</td>
                    <td colSpan={1} className="border border-black p-2 bg-[#e6eeff] font-medium">{project.printerSpec.trappingBleed.standardTrap || ''}</td>
                  </tr>
                  <tr>
                    <td colSpan={1} className="border border-black p-2 bg-white">Metalic color trap</td>
                    <td colSpan={1} className="border border-black p-2 bg-[#e6eeff] font-medium">{project.printerSpec.trappingBleed.metalicTrap || ''}</td>
                    <td colSpan={1} className="border border-black p-2 bg-white">CT Standard trap</td>
                    <td colSpan={1} className="border border-black p-2 bg-[#e6eeff] font-medium">{project.printerSpec.trappingBleed.ctStandardTrap || ''}</td>
                    <td colSpan={1} className="border border-black p-2 bg-white">CT Minimum trap</td>
                    <td colSpan={1} className="border border-black p-2 bg-[#e6eeff] font-medium">{project.printerSpec.trappingBleed.ctMinTrap || ''}</td>
                  </tr>
                  <tr>
                    <td colSpan={1} className="border border-black p-2 bg-white">CT Maximum trap</td>
                    <td colSpan={1} className="border border-black p-2 bg-[#e6eeff] font-medium">{project.printerSpec.trappingBleed.ctMaxTrap || ''}</td>
                    <td colSpan={1} className="border border-black p-2 bg-white">Varnish Trap</td>
                    <td colSpan={1} className="border border-black p-2 bg-[#e6eeff] font-medium">{project.printerSpec.trappingBleed.varnishTrap || ''}</td>
                    <td colSpan={1} className="border border-black p-2 bg-white"></td>
                    <td colSpan={1} className="border border-black p-0 bg-white"></td>
                  </tr>
                </>
              )}

              {/* Pullback/Holdback */}
              {project.printerSpec.pullbackHoldback && (
                <>
                  <tr>
                    <th colSpan={6} className="border border-black bg-white p-2 text-center font-bold text-sm">Pullback/Holdback</th>
                  </tr>
                  <tr>
                    <td colSpan={1} className="border border-black p-2 bg-white">General Pullback</td>
                    <td colSpan={1} className="border border-black p-2 bg-[#e6eeff] font-medium">{project.printerSpec.pullbackHoldback.generalPullback || ''}</td>
                    <td colSpan={1} className="border border-black p-2 bg-white">White pullback 1</td>
                    <td colSpan={1} className="border border-black p-2 bg-[#e6eeff] font-medium">{project.printerSpec.pullbackHoldback.whitePullback1 || ''}</td>
                    <td colSpan={1} className="border border-black p-2 bg-white">White pullback 2</td>
                    <td colSpan={1} className="border border-black p-2 bg-[#e6eeff] font-medium">{project.printerSpec.pullbackHoldback.whitePullback2 || ''}</td>
                  </tr>
                  <tr>
                    <td colSpan={1} className="border border-black p-2 bg-white">Varnish pullback</td>
                    <td colSpan={1} className="border border-black p-2 bg-[#e6eeff] font-medium">{project.printerSpec.pullbackHoldback.varnishPullback || ''}</td>
                    <td colSpan={1} className="border border-black p-2 bg-white">Keyline</td>
                    <td colSpan={1} className="border border-black p-2 bg-[#e6eeff] font-medium">{project.printerSpec.pullbackHoldback.keyline || ''}</td>
                    <td colSpan={1} className="border border-black p-2 bg-white"></td>
                    <td colSpan={1} className="border border-black p-0 bg-white"></td>
                  </tr>
                </>
              )}

              {/* Proofing profile Name */}
              <tr>
                 <th colSpan={6} className="border border-black bg-white p-2 text-center font-bold text-sm">Proofing profile Name</th>
              </tr>
              <tr>
                <td colSpan={6} className="border border-black p-2 bg-[#e6eeff] h-8 font-medium">
                  {project.printerSpec.proofingProfile || ''}
                </td>
              </tr>

              {/* Preferred format */}
              <tr>
                <th colSpan={6} className="border border-black bg-white p-2 text-center font-bold text-sm">Preferred format for final artwork file delivery</th>
              </tr>
              <tr>
                <td colSpan={2} className="border border-black p-2 bg-white h-8 align-middle">
                  <div className="flex items-center gap-3 w-full h-full px-2">
                    <span className="text-sm font-bold text-gray-700">Esko PDF</span>
                    {project.printerSpec.preferredFormat === 'Esko PDF' && <span className="font-bold text-lg">✓</span>}
                  </div>
                </td>
                <td colSpan={2} className="border border-black p-2 bg-white h-8 align-middle">
                  <div className="flex items-center gap-3 w-full h-full px-2">
                    <span className="text-sm font-bold text-gray-700">Illustrator CC</span>
                    {project.printerSpec.preferredFormat === 'Illustrator CC' && <span className="font-bold text-lg">✓</span>}
                  </div>
                </td>
                <td colSpan={2} className="border border-black p-2 bg-white h-8 align-middle">
                  <div className="flex items-center gap-3 w-full h-full px-2">
                    <span className="text-sm font-bold text-gray-700">Hi resolution PDF</span>
                    {project.printerSpec.preferredFormat === 'Hi resolution PDF' && <span className="font-bold text-lg">✓</span>}
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

    </div>
  );
};


