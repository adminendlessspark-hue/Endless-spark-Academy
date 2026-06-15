const fs = require('fs');

let content = fs.readFileSync('src/components/PrintableChecklists.tsx', 'utf-8');

// Replace the `ClientBriefPrintable` function entirely.
const startIndex = content.indexOf('export const ClientBriefPrintable');
const endIndex = content.indexOf('};', startIndex) + 2;

if (startIndex === -1 || endIndex < startIndex) {
  console.error("Could not find ClientBriefPrintable");
  process.exit(1);
}

const newComponent = `export const ClientBriefPrintable = ({ project, logoUrl }: Props) => {
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
          <div><strong>Job Number:</strong> {project.projectCode || '-'}</div>
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
              <td colSpan={1} className="border border-black p-2 bg-[#e6eeff] font-medium">{project.estimatedTime ? \`\${project.estimatedTime} minutes\` : '-'}</td>
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
                  <td colSpan={1} className="border border-black p-2 bg-white">Variant Name</td>
                  <td colSpan={2} className="border border-black p-2 bg-[#e6eeff] font-medium">{project.clientBrief.variantName || '-'}</td>
                  <td colSpan={1} className="border border-black p-2 bg-white">Net Weight</td>
                  <td colSpan={2} className="border border-black p-2 bg-[#e6eeff] font-medium">{project.clientBrief.netWeight || '-'}</td>
                </tr>
                <tr>
                  <td colSpan={1} className="border border-black p-2 bg-white">Base File Name</td>
                  <td colSpan={2} className="border border-black p-2 bg-[#e6eeff] font-medium">{project.clientBrief.baseFileName || '-'}</td>
                  <td colSpan={1} className="border border-black p-2 bg-white">ED Name</td>
                  <td colSpan={2} className="border border-black p-2 bg-[#e6eeff] font-medium">{project.clientBrief.edName || '-'}</td>
                </tr>
                <tr>
                  <td colSpan={1} className="border border-black p-2 bg-white">Reference File Name</td>
                  <td colSpan={2} className="border border-black p-2 bg-[#e6eeff] font-medium">{project.clientBrief.referenceFileName || '-'}</td>
                  <td colSpan={1} className="border border-black p-2 bg-white">Master Job</td>
                  <td colSpan={2} className="border border-black p-2 bg-[#e6eeff] font-medium">{project.clientBrief.masterJob || '-'}</td>
                </tr>
                <tr>
                  <td colSpan={1} className="border border-black p-2 bg-white">Annotation PDF Name</td>
                  <td colSpan={2} className="border border-black p-2 bg-[#e6eeff] font-medium">{project.clientBrief.annotationPdfName || '-'}</td>
                  <td colSpan={1} className="border border-black p-2 bg-white">File Name (Auto)</td>
                  <td colSpan={2} className="border border-black p-2 bg-[#e6eeff] font-medium">{project.clientBrief.fileName || '-'}</td>
                </tr>
                <tr>
                  <td colSpan={1} className="border border-black p-2 bg-white align-top">Job Brief</td>
                  <td colSpan={5} className="border border-black p-2 bg-[#e6eeff] font-medium whitespace-pre-wrap">{project.clientBrief.jobBrief || '-'}</td>
                </tr>
              </>
            )}

            {/* Printer Specification (Basic) */}
            {project.printerSpec && (
              <>
                <tr>
                  <th colSpan={6} className="border border-black bg-white p-2 text-center font-bold text-sm">Printer Specification</th>
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
              </>
            )}
          </tbody>
        </table>
      </div>

      {project.printerSpec?.barcodes && project.printerSpec.barcodes.length > 0 && (
        <div className="mt-4 break-inside-avoid w-full">
          <h4 className="font-bold mb-2 text-sm">Barcodes</h4>
          <table className="w-full border-collapse border-2 border-black text-xs text-left">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-black p-2">Code Type</th>
                <th className="border border-black p-2">Code Number</th>
                <th className="border border-black p-2">Code Color</th>
                <th className="border border-black p-2">BWR</th>
                <th className="border border-black p-2">Mag.</th>
                <th className="border border-black p-2">Narrow Bar</th>
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
        <div className="mt-4 break-inside-avoid w-full">
          <h4 className="font-bold mb-2 text-sm">Color Rotation Details</h4>
          <table className="w-full border-collapse border-2 border-black text-xs text-left">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-black p-2">Color Name</th>
                <th className="border border-black p-2">Line/Screen</th>
                <th className="border border-black p-2">LPI</th>
                <th className="border border-black p-2">Dot Type</th>
                <th className="border border-black p-2">Angle</th>
                <th className="border border-black p-2">New</th>
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

    </div>
  );
};
`

const updatedContent = content.substring(0, startIndex) + newComponent + content.substring(endIndex);
fs.writeFileSync('src/components/PrintableChecklists.tsx', updatedContent, 'utf-8');
console.log("Updated PrintableChecklists.tsx");
