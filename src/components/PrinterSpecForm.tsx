import React from 'react';
import { Trash2, PlusCircle } from 'lucide-react';

export default function PrinterSpecForm({ projectForm, setProjectForm }: { projectForm: any, setProjectForm: any }) {
  const insertBarcodeRow = (index: number) => {
    const newBc = [...projectForm.printerSpec.barcodes];
    newBc.splice(index + 1, 0, {codeType:'', codeNumber:'', codeColour:'', bwr:'', magnification:'', narrowBar:''});
    setProjectForm({...projectForm, printerSpec: {...projectForm.printerSpec, barcodes: newBc}});
  };

  const insertColorRow = (index: number) => {
    const newCr = [...projectForm.printerSpec.colorRotation];
    newCr.splice(index + 1, 0, {colorName:'', lineScreen:'', lpi:'', dotType:'', angle:'', new:''});
    setProjectForm({...projectForm, printerSpec: {...projectForm.printerSpec, colorRotation: newCr}});
  };

  return (
    <div className="space-y-8">
      {/* Printer Name */}
      <div>
        <label className="block font-bold text-gray-900 mb-2">Printer Name</label>
        <input
          type="text"
          value={projectForm.printerSpec.printerName || ''}
          onChange={e => setProjectForm({
            ...projectForm,
            printerSpec: { ...projectForm.printerSpec, printerName: e.target.value }
          })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-pink-500"
          placeholder="Enter printer name or company..."
        />
      </div>

      {/* Barcodes */}
      <div>
        <h4 className="font-bold text-gray-900 mb-3 border-b pb-2">Barcodes</h4>
        <div className="overflow-x-auto border border-gray-200 rounded-lg">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="p-2 border-r font-medium text-gray-600">Code type</th>
                <th className="p-2 border-r font-medium text-gray-600">Code number</th>
                <th className="p-2 border-r font-medium text-gray-600">Code colour</th>
                <th className="p-2 border-r font-medium text-gray-600">BWR</th>
                <th className="p-2 border-r font-medium text-gray-600">Magnification</th>
                <th className="p-2 border-r font-medium text-gray-600">Narrow bar</th>
                <th className="p-2 font-medium text-gray-600">Action</th>
              </tr>
            </thead>
            <tbody>
              {projectForm.printerSpec.barcodes.map((bc: any, idx: number) => (
                <tr key={idx} className="border-b last:border-0">
                  <td className="p-0 border-r"><input type="text" className="w-full p-2 outline-none focus:bg-blue-50" value={bc.codeType} onChange={e => { const newBc = [...projectForm.printerSpec.barcodes]; newBc[idx].codeType = e.target.value; setProjectForm({...projectForm, printerSpec: {...projectForm.printerSpec, barcodes: newBc}}) }} /></td>
                  <td className="p-0 border-r"><input type="text" className="w-full p-2 outline-none focus:bg-blue-50" value={bc.codeNumber} onChange={e => { const newBc = [...projectForm.printerSpec.barcodes]; newBc[idx].codeNumber = e.target.value; setProjectForm({...projectForm, printerSpec: {...projectForm.printerSpec, barcodes: newBc}}) }} /></td>
                  <td className="p-0 border-r"><input type="text" className="w-full p-2 outline-none focus:bg-blue-50" value={bc.codeColour} onChange={e => { const newBc = [...projectForm.printerSpec.barcodes]; newBc[idx].codeColour = e.target.value; setProjectForm({...projectForm, printerSpec: {...projectForm.printerSpec, barcodes: newBc}}) }} /></td>
                  <td className="p-0 border-r"><input type="text" className="w-full p-2 outline-none focus:bg-blue-50" value={bc.bwr} onChange={e => { const newBc = [...projectForm.printerSpec.barcodes]; newBc[idx].bwr = e.target.value; setProjectForm({...projectForm, printerSpec: {...projectForm.printerSpec, barcodes: newBc}}) }} /></td>
                  <td className="p-0 border-r"><input type="text" className="w-full p-2 outline-none focus:bg-blue-50" value={bc.magnification} onChange={e => { const newBc = [...projectForm.printerSpec.barcodes]; newBc[idx].magnification = e.target.value; setProjectForm({...projectForm, printerSpec: {...projectForm.printerSpec, barcodes: newBc}}) }} /></td>
                  <td className="p-0 border-r"><input type="text" className="w-full p-2 outline-none focus:bg-blue-50" value={bc.narrowBar} onChange={e => { const newBc = [...projectForm.printerSpec.barcodes]; newBc[idx].narrowBar = e.target.value; setProjectForm({...projectForm, printerSpec: {...projectForm.printerSpec, barcodes: newBc}}) }} /></td>
                  <td className="p-2">
                    <div className="flex items-center justify-center gap-1">
                      <button 
                        onClick={() => insertBarcodeRow(idx)}
                        className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        title="Insert Row Below"
                      >
                        <PlusCircle className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => {
                          const newBc = projectForm.printerSpec.barcodes.filter((_: any, i: number) => i !== idx);
                          setProjectForm({...projectForm, printerSpec: {...projectForm.printerSpec, barcodes: newBc}});
                        }}
                        className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Delete Row"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button onClick={() => setProjectForm({...projectForm, printerSpec: {...projectForm.printerSpec, barcodes: [...projectForm.printerSpec.barcodes, {codeType:'', codeNumber:'', codeColour:'', bwr:'', magnification:'', narrowBar:''}]}})} className="text-xs font-bold text-pink-600 mt-2 hover:text-pink-700">+ Add Barcode Row</button>
      </div>

      {/* Color Rotation Details */}
      <div>
        <h4 className="font-bold text-gray-900 mb-3 border-b pb-2">Color Rotation Details</h4>
        <div className="overflow-x-auto border border-gray-200 rounded-lg">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="p-2 border-r font-medium text-gray-600">Color Name</th>
                <th className="p-2 border-r font-medium text-gray-600">Line/Screen</th>
                <th className="p-2 border-r font-medium text-gray-600">LPI</th>
                <th className="p-2 border-r font-medium text-gray-600">Dot Type</th>
                <th className="p-2 border-r font-medium text-gray-600">Angle</th>
                <th className="p-2 border-r font-medium text-gray-600">New</th>
                <th className="p-2 font-medium text-gray-600">Action</th>
              </tr>
            </thead>
            <tbody>
              {projectForm.printerSpec.colorRotation.map((cr: any, idx: number) => (
                <tr key={idx} className="border-b last:border-0">
                  <td className="p-0 border-r"><input type="text" className="w-full p-2 outline-none focus:bg-blue-50" value={cr.colorName} onChange={e => { const newCr = [...projectForm.printerSpec.colorRotation]; newCr[idx].colorName = e.target.value; setProjectForm({...projectForm, printerSpec: {...projectForm.printerSpec, colorRotation: newCr}}) }} /></td>
                  <td className="p-0 border-r"><input type="text" className="w-full p-2 outline-none focus:bg-blue-50" value={cr.lineScreen} onChange={e => { const newCr = [...projectForm.printerSpec.colorRotation]; newCr[idx].lineScreen = e.target.value; setProjectForm({...projectForm, printerSpec: {...projectForm.printerSpec, colorRotation: newCr}}) }} /></td>
                  <td className="p-0 border-r"><input type="text" className="w-full p-2 outline-none focus:bg-blue-50" value={cr.lpi} onChange={e => { const newCr = [...projectForm.printerSpec.colorRotation]; newCr[idx].lpi = e.target.value; setProjectForm({...projectForm, printerSpec: {...projectForm.printerSpec, colorRotation: newCr}}) }} /></td>
                  <td className="p-0 border-r"><input type="text" className="w-full p-2 outline-none focus:bg-blue-50" value={cr.dotType} onChange={e => { const newCr = [...projectForm.printerSpec.colorRotation]; newCr[idx].dotType = e.target.value; setProjectForm({...projectForm, printerSpec: {...projectForm.printerSpec, colorRotation: newCr}}) }} /></td>
                  <td className="p-0 border-r"><input type="text" className="w-full p-2 outline-none focus:bg-blue-50" value={cr.angle} onChange={e => { const newCr = [...projectForm.printerSpec.colorRotation]; newCr[idx].angle = e.target.value; setProjectForm({...projectForm, printerSpec: {...projectForm.printerSpec, colorRotation: newCr}}) }} /></td>
                  <td className="p-0 border-r"><input type="text" className="w-full p-2 outline-none focus:bg-blue-50" value={cr.new} onChange={e => { const newCr = [...projectForm.printerSpec.colorRotation]; newCr[idx].new = e.target.value; setProjectForm({...projectForm, printerSpec: {...projectForm.printerSpec, colorRotation: newCr}}) }} /></td>
                  <td className="p-2">
                    <div className="flex items-center justify-center gap-1">
                      <button 
                        onClick={() => insertColorRow(idx)}
                        className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        title="Insert Row Below"
                      >
                        <PlusCircle className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => {
                          const newCr = projectForm.printerSpec.colorRotation.filter((_: any, i: number) => i !== idx);
                          setProjectForm({...projectForm, printerSpec: {...projectForm.printerSpec, colorRotation: newCr}});
                        }}
                        className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Delete Row"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button onClick={() => setProjectForm({...projectForm, printerSpec: {...projectForm.printerSpec, colorRotation: [...projectForm.printerSpec.colorRotation, {colorName:'', lineScreen:'', lpi:'', dotType:'', angle:'', new:''}]}})} className="text-xs font-bold text-pink-600 mt-2 hover:text-pink-700">+ Add Color Row</button>
      </div>

      {/* Print Method */}
      <div>
        <h4 className="font-bold text-gray-900 mb-3 border-b pb-2">Print Method</h4>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {['Offset', 'Flexo', 'Gravure', 'Dry offset', 'Digital'].map(method => (
            <label key={method} className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="printMethod" value={method} checked={projectForm.printerSpec.printMethod === method} onChange={(e) => setProjectForm({...projectForm, printerSpec: {...projectForm.printerSpec, printMethod: e.target.value}})} className="w-4 h-4 text-pink-600" />
              <span className="text-sm text-gray-700">{method}</span>
            </label>
          ))}
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="radio" name="printMethod" value="Others" checked={projectForm.printerSpec.printMethod.startsWith('Others')} onChange={(e) => setProjectForm({...projectForm, printerSpec: {...projectForm.printerSpec, printMethod: 'Others'}})} className="w-4 h-4 text-pink-600" />
            <span className="text-sm text-gray-700">Others</span>
            {projectForm.printerSpec.printMethod.startsWith('Others') && (
              <input type="text" className="border-b border-gray-300 outline-none px-1 w-24 text-sm" value={projectForm.printerSpec.printMethod.replace('Others', '').trim()} onChange={(e) => setProjectForm({...projectForm, printerSpec: {...projectForm.printerSpec, printMethod: `Others ${e.target.value}`}})} placeholder="Specify..." />
            )}
          </label>
        </div>
      </div>
      
      {/* Printing Substrate */}
      <div>
        <h4 className="font-bold text-gray-900 mb-3 border-b pb-2">Printing Substrate</h4>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {['Carton board', 'Foil', 'White Poly', 'Paper', 'Metal', 'Poly clear'].map(sub => (
            <label key={sub} className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="printingSubstrate" value={sub} checked={projectForm.printerSpec.printingSubstrate === sub} onChange={(e) => setProjectForm({...projectForm, printerSpec: {...projectForm.printerSpec, printingSubstrate: e.target.value}})} className="w-4 h-4 text-pink-600" />
              <span className="text-sm text-gray-700">{sub}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Face/Reverse Print */}
      <div>
        <h4 className="font-bold text-gray-900 mb-3 border-b pb-2">Face/Reverse Print</h4>
        <div className="grid grid-cols-3 gap-3">
          {['Surface', 'Reverse', 'Both'].map(val => (
            <label key={val} className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="faceReversePrint" value={val} checked={projectForm.printerSpec.faceReversePrint === val} onChange={(e) => setProjectForm({...projectForm, printerSpec: {...projectForm.printerSpec, faceReversePrint: e.target.value}})} className="w-4 h-4 text-pink-600" />
              <span className="text-sm text-gray-700">{val}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Max Colors */}
      <div>
        <h4 className="font-bold text-gray-900 mb-3 border-b pb-2">Max. number of colors for machine</h4>
        <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
          {['4', '5', '6', '7', '8', '9', '10', '11', '12'].map(val => (
            <label key={val} className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="maxColors" value={val} checked={projectForm.printerSpec.maxColors === val} onChange={(e) => setProjectForm({...projectForm, printerSpec: {...projectForm.printerSpec, maxColors: e.target.value}})} className="w-4 h-4 text-pink-600" />
              <span className="text-sm text-gray-700">{val}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Varnish */}
      <div>
        <h4 className="font-bold text-gray-900 mb-3 border-b pb-2">Is varnish included?</h4>
        <div className="flex flex-wrap gap-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="radio" name="varnishIncluded" value="No" checked={projectForm.printerSpec.varnishIncluded === 'No'} onChange={(e) => setProjectForm({...projectForm, printerSpec: {...projectForm.printerSpec, varnishIncluded: e.target.value}})} className="w-4 h-4 text-pink-600" />
            <span className="text-sm text-gray-700">No</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="radio" name="varnishIncluded" value="Yes - Overall" checked={projectForm.printerSpec.varnishIncluded === 'Yes - Overall'} onChange={(e) => setProjectForm({...projectForm, printerSpec: {...projectForm.printerSpec, varnishIncluded: e.target.value}})} className="w-4 h-4 text-pink-600" />
            <span className="text-sm text-gray-700">Yes - Overall</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="radio" name="varnishIncluded" value="Yes - Spot" checked={projectForm.printerSpec.varnishIncluded === 'Yes - Spot'} onChange={(e) => setProjectForm({...projectForm, printerSpec: {...projectForm.printerSpec, varnishIncluded: e.target.value}})} className="w-4 h-4 text-pink-600" />
            <span className="text-sm text-gray-700">Yes - Spot</span>
          </label>
        </div>
      </div>

      {/* Artwork Information Table */}
      <div className="overflow-x-auto w-full mt-8 mb-6">
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
            {/* Artwork Information */}
            <tr>
              <th colSpan={6} className="border border-black bg-white p-2 text-center font-bold text-sm">Artwork Information</th>
            </tr>
            <tr>
              <td colSpan={2} className="border border-black p-2 bg-white">Min. line thickness pos - [MM]</td>
              <td colSpan={1} className="border border-black p-0 bg-[#e6eeff]"><input type="text" className="w-full h-full p-2 bg-transparent outline-none focus:bg-blue-100" value={(projectForm.printerSpec.artworkInfo as any).minLineThicknessPos || ''} onChange={e => setProjectForm({...projectForm, printerSpec: {...projectForm.printerSpec, artworkInfo: {...projectForm.printerSpec.artworkInfo, minLineThicknessPos: e.target.value}}})} /></td>
              <td colSpan={2} className="border border-black p-2 bg-white">Min. line thickness rev [MM]</td>
              <td colSpan={1} className="border border-black p-0 bg-[#e6eeff]"><input type="text" className="w-full h-full p-2 bg-transparent outline-none focus:bg-blue-100" value={(projectForm.printerSpec.artworkInfo as any).minLineThicknessRev || ''} onChange={e => setProjectForm({...projectForm, printerSpec: {...projectForm.printerSpec, artworkInfo: {...projectForm.printerSpec.artworkInfo, minLineThicknessRev: e.target.value}}})} /></td>
            </tr>
            <tr>
              <td colSpan={2} className="border border-black p-2 bg-white">Min. text size pos. [pt]</td>
              <td colSpan={1} className="border border-black p-0 bg-[#e6eeff]"><input type="text" className="w-full h-full p-2 bg-transparent outline-none focus:bg-blue-100" value={(projectForm.printerSpec.artworkInfo as any).minTextSizePos || ''} onChange={e => setProjectForm({...projectForm, printerSpec: {...projectForm.printerSpec, artworkInfo: {...projectForm.printerSpec.artworkInfo, minTextSizePos: e.target.value}}})} /></td>
              <td colSpan={2} className="border border-black p-2 bg-white">Min. text size rev. [pt]</td>
              <td colSpan={1} className="border border-black p-0 bg-[#e6eeff]"><input type="text" className="w-full h-full p-2 bg-transparent outline-none focus:bg-blue-100" value={(projectForm.printerSpec.artworkInfo as any).minTextSizeRev || ''} onChange={e => setProjectForm({...projectForm, printerSpec: {...projectForm.printerSpec, artworkInfo: {...projectForm.printerSpec.artworkInfo, minTextSizeRev: e.target.value}}})} /></td>
            </tr>
            <tr>
              <td colSpan={2} className="border border-black p-2 bg-white">Min Type Multi-Color Positive</td>
              <td colSpan={1} className="border border-black p-0 bg-[#e6eeff]"><input type="text" className="w-full h-full p-2 bg-transparent outline-none focus:bg-blue-100" value={(projectForm.printerSpec.artworkInfo as any).minTypeMultiColorPos || ''} onChange={e => setProjectForm({...projectForm, printerSpec: {...projectForm.printerSpec, artworkInfo: {...projectForm.printerSpec.artworkInfo, minTypeMultiColorPos: e.target.value}}})} /></td>
              <td colSpan={2} className="border border-black p-2 bg-white">Min Type Multi-Color Reverse</td>
              <td colSpan={1} className="border border-black p-0 bg-[#e6eeff]"><input type="text" className="w-full h-full p-2 bg-transparent outline-none focus:bg-blue-100" value={(projectForm.printerSpec.artworkInfo as any).minTypeMultiColorRev || ''} onChange={e => setProjectForm({...projectForm, printerSpec: {...projectForm.printerSpec, artworkInfo: {...projectForm.printerSpec.artworkInfo, minTypeMultiColorRev: e.target.value}}})} /></td>
            </tr>
            <tr>
              <td colSpan={2} className="border border-black p-2 bg-white">Minimum symbol Size pos. [pt]</td>
              <td colSpan={1} className="border border-black p-0 bg-[#e6eeff]"><input type="text" className="w-full h-full p-2 bg-transparent outline-none focus:bg-blue-100" value={(projectForm.printerSpec.artworkInfo as any).minSymbolSizePos || ''} onChange={e => setProjectForm({...projectForm, printerSpec: {...projectForm.printerSpec, artworkInfo: {...projectForm.printerSpec.artworkInfo, minSymbolSizePos: e.target.value}}})} /></td>
              <td colSpan={2} className="border border-black p-2 bg-white">Minimum symbol Size neg. [pt]</td>
              <td colSpan={1} className="border border-black p-0 bg-[#e6eeff]"><input type="text" className="w-full h-full p-2 bg-transparent outline-none focus:bg-blue-100" value={(projectForm.printerSpec.artworkInfo as any).minSymbolSizeNeg || ''} onChange={e => setProjectForm({...projectForm, printerSpec: {...projectForm.printerSpec, artworkInfo: {...projectForm.printerSpec.artworkInfo, minSymbolSizeNeg: e.target.value}}})} /></td>
            </tr>
            <tr>
              <td colSpan={2} className="border border-black p-2 bg-white">x-height</td>
              <td colSpan={1} className="border border-black p-0 bg-[#e6eeff]"><input type="text" className="w-full h-full p-2 bg-transparent outline-none focus:bg-blue-100" value={(projectForm.printerSpec.artworkInfo as any).xHeight || ''} onChange={e => setProjectForm({...projectForm, printerSpec: {...projectForm.printerSpec, artworkInfo: {...projectForm.printerSpec.artworkInfo, xHeight: e.target.value}}})} /></td>
              <td colSpan={2} className="border border-black p-2 bg-white"></td>
              <td colSpan={1} className="border border-black p-0 bg-white"></td>
            </tr>
            <tr>
              <td colSpan={1} className="border border-black p-2 bg-white">Bleed</td>
              <td colSpan={1} className="border border-black p-0 bg-[#e6eeff]"><input type="text" className="w-full h-full p-2 bg-transparent outline-none focus:bg-blue-100" value={(projectForm.printerSpec.artworkInfo as any).bleed || ''} onChange={e => setProjectForm({...projectForm, printerSpec: {...projectForm.printerSpec, artworkInfo: {...projectForm.printerSpec.artworkInfo, bleed: e.target.value}}})} /></td>
              <td colSpan={1} className="border border-black p-2 bg-white">Rollover</td>
              <td colSpan={1} className="border border-black p-0 bg-[#e6eeff]"><input type="text" className="w-full h-full p-2 bg-transparent outline-none focus:bg-blue-100" value={(projectForm.printerSpec.artworkInfo as any).rollover || ''} onChange={e => setProjectForm({...projectForm, printerSpec: {...projectForm.printerSpec, artworkInfo: {...projectForm.printerSpec.artworkInfo, rollover: e.target.value}}})} /></td>
              <td colSpan={1} className="border border-black p-2 bg-white">Type Safety</td>
              <td colSpan={1} className="border border-black p-0 bg-[#e6eeff]"><input type="text" className="w-full h-full p-2 bg-transparent outline-none focus:bg-blue-100" value={(projectForm.printerSpec.artworkInfo as any).typeSafety || ''} onChange={e => setProjectForm({...projectForm, printerSpec: {...projectForm.printerSpec, artworkInfo: {...projectForm.printerSpec.artworkInfo, typeSafety: e.target.value}}})} /></td>
            </tr>
            <tr>
              <td colSpan={2} className="border border-black p-2 bg-white">Min. dot size on file [%]</td>
              <td colSpan={1} className="border border-black p-0 bg-[#e6eeff]"><input type="text" className="w-full h-full p-2 bg-transparent outline-none focus:bg-blue-100" value={(projectForm.printerSpec.artworkInfo as any).minDotSize || ''} onChange={e => setProjectForm({...projectForm, printerSpec: {...projectForm.printerSpec, artworkInfo: {...projectForm.printerSpec.artworkInfo, minDotSize: e.target.value}}})} /></td>
              <td colSpan={2} className="border border-black p-2 bg-white">Max. Tonal value in gradient</td>
              <td colSpan={1} className="border border-black p-0 bg-[#e6eeff]"><input type="text" className="w-full h-full p-2 bg-transparent outline-none focus:bg-blue-100" value={(projectForm.printerSpec.artworkInfo as any).maxTonalValue || ''} onChange={e => setProjectForm({...projectForm, printerSpec: {...projectForm.printerSpec, artworkInfo: {...projectForm.printerSpec.artworkInfo, maxTonalValue: e.target.value}}})} /></td>
            </tr>
            <tr>
              <td colSpan={2} className="border border-black p-2 bg-white">Max. Ink coverage</td>
              <td colSpan={1} className="border border-black p-0 bg-[#e6eeff]"><input type="text" className="w-full h-full p-2 bg-transparent outline-none focus:bg-blue-100" value={(projectForm.printerSpec.artworkInfo as any).maxInkCoverage || ''} onChange={e => setProjectForm({...projectForm, printerSpec: {...projectForm.printerSpec, artworkInfo: {...projectForm.printerSpec.artworkInfo, maxInkCoverage: e.target.value}}})} /></td>
              <td colSpan={2} className="border border-black p-2 bg-white"></td>
              <td colSpan={1} className="border border-black p-0 bg-white"></td>
            </tr>

            {/* Eye mark */}
            <tr>
              <th colSpan={6} className="border border-black bg-white p-2 text-center font-bold text-sm">Eye mark</th>
            </tr>
            <tr>
              <td colSpan={1} className="border border-black p-2 bg-white">Eye Mark size</td>
              <td colSpan={1} className="border border-black p-0 bg-[#e6eeff]"><input type="text" className="w-full h-full p-2 bg-transparent outline-none focus:bg-blue-100" value={(projectForm.printerSpec.eyeMark as any).size || ''} onChange={e => setProjectForm({...projectForm, printerSpec: {...projectForm.printerSpec, eyeMark: {...projectForm.printerSpec.eyeMark, size: e.target.value}}})} /></td>
              <td colSpan={2} className="border border-black p-2 bg-white">Eye Mark Colour(exp)</td>
              <td colSpan={2} className="border border-black p-0 bg-[#e6eeff]"><input type="text" className="w-full h-full p-2 bg-transparent outline-none focus:bg-blue-100" value={(projectForm.printerSpec.eyeMark as any).colour || ''} onChange={e => setProjectForm({...projectForm, printerSpec: {...projectForm.printerSpec, eyeMark: {...projectForm.printerSpec.eyeMark, colour: e.target.value}}})} /></td>
            </tr>
            <tr>
              <td colSpan={1} className="border border-black p-2 bg-white">Eye Mark Position</td>
              <td colSpan={1} className="border border-black p-0 bg-[#e6eeff]"><input type="text" className="w-full h-full p-2 bg-transparent outline-none focus:bg-blue-100" value={(projectForm.printerSpec.eyeMark as any).position || ''} onChange={e => setProjectForm({...projectForm, printerSpec: {...projectForm.printerSpec, eyeMark: {...projectForm.printerSpec.eyeMark, position: e.target.value}}})} /></td>
              <td colSpan={2} className="border border-black p-2 bg-white">Eye Mark under colour pullback</td>
              <td colSpan={2} className="border border-black p-0 bg-[#e6eeff]"><input type="text" className="w-full h-full p-2 bg-transparent outline-none focus:bg-blue-100" value={(projectForm.printerSpec.eyeMark as any).underColourPullback || ''} onChange={e => setProjectForm({...projectForm, printerSpec: {...projectForm.printerSpec, eyeMark: {...projectForm.printerSpec.eyeMark, underColourPullback: e.target.value}}})} /></td>
            </tr>

            {/* Microdot */}
            <tr>
              <th colSpan={6} className="border border-black bg-white p-2 text-center font-bold text-sm">Microdot</th>
            </tr>
            <tr>
              <td colSpan={1} className="border border-black p-2 bg-white">Location</td>
              <td colSpan={1} className="border border-black p-0 bg-[#e6eeff]"><input type="text" className="w-full h-full p-2 bg-transparent outline-none focus:bg-blue-100" value={(projectForm.printerSpec.microdot as any).location1 || ''} onChange={e => setProjectForm({...projectForm, printerSpec: {...projectForm.printerSpec, microdot: {...projectForm.printerSpec.microdot, location1: e.target.value}}})} /></td>
              <td colSpan={1} className="border border-black p-2 bg-white">Location</td>
              <td colSpan={1} className="border border-black p-0 bg-[#e6eeff]"><input type="text" className="w-full h-full p-2 bg-transparent outline-none focus:bg-blue-100" value={(projectForm.printerSpec.microdot as any).location2 || ''} onChange={e => setProjectForm({...projectForm, printerSpec: {...projectForm.printerSpec, microdot: {...projectForm.printerSpec.microdot, location2: e.target.value}}})} /></td>
              <td colSpan={1} className="border border-black p-2 bg-white">Microdot Size</td>
              <td colSpan={1} className="border border-black p-0 bg-[#e6eeff]"><input type="text" className="w-full h-full p-2 bg-transparent outline-none focus:bg-blue-100" value={(projectForm.printerSpec.microdot as any).size || ''} onChange={e => setProjectForm({...projectForm, printerSpec: {...projectForm.printerSpec, microdot: {...projectForm.printerSpec.microdot, size: e.target.value}}})} /></td>
            </tr>

            {/* Rich Black */}
            <tr>
              <th colSpan={6} className="border border-black bg-white p-2 text-center font-bold text-sm">Rich Black</th>
            </tr>
            <tr>
              <td colSpan={1} className="border border-black p-2 bg-white">Cyan</td>
              <td colSpan={1} className="border border-black p-0 bg-[#e6eeff]"><input type="text" className="w-full h-full p-2 bg-transparent outline-none focus:bg-blue-100" value={(projectForm.printerSpec.richBlack as any).cyan || ''} onChange={e => setProjectForm({...projectForm, printerSpec: {...projectForm.printerSpec, richBlack: {...projectForm.printerSpec.richBlack, cyan: e.target.value}}})} /></td>
              <td colSpan={1} className="border border-black p-2 bg-white">Yellow</td>
              <td colSpan={1} className="border border-black p-0 bg-white"><input type="text" className="w-full h-full p-2 bg-transparent outline-none focus:bg-blue-100" value={(projectForm.printerSpec.richBlack as any).yellow || ''} onChange={e => setProjectForm({...projectForm, printerSpec: {...projectForm.printerSpec, richBlack: {...projectForm.printerSpec.richBlack, yellow: e.target.value}}})} /></td>
              <td colSpan={1} className="border border-black p-2 bg-white">Magenta</td>
              <td colSpan={1} className="border border-black p-0 bg-[#e6eeff]"><input type="text" className="w-full h-full p-2 bg-transparent outline-none focus:bg-blue-100" value={(projectForm.printerSpec.richBlack as any).magenta || ''} onChange={e => setProjectForm({...projectForm, printerSpec: {...projectForm.printerSpec, richBlack: {...projectForm.printerSpec.richBlack, magenta: e.target.value}}})} /></td>
            </tr>
            <tr>
              <td colSpan={1} className="border border-black p-2 bg-white">Black</td>
              <td colSpan={1} className="border border-black p-0 bg-[#e6eeff]"><input type="text" className="w-full h-full p-2 bg-transparent outline-none focus:bg-blue-100" value={(projectForm.printerSpec.richBlack as any).black || ''} onChange={e => setProjectForm({...projectForm, printerSpec: {...projectForm.printerSpec, richBlack: {...projectForm.printerSpec.richBlack, black: e.target.value}}})} /></td>
              <td colSpan={1} className="border border-black p-2 bg-white"></td>
              <td colSpan={1} className="border border-black p-0 bg-white"></td>
              <td colSpan={1} className="border border-black p-2 bg-white"></td>
              <td colSpan={1} className="border border-black p-0 bg-white"></td>
            </tr>

            {/* Trapping/Bleed */}
            <tr>
              <th colSpan={6} className="border border-black bg-white p-2 text-center font-bold text-sm">Trapping/Bleed</th>
            </tr>
            <tr>
              <td colSpan={1} className="border border-black p-2 bg-white">Minimum Trap</td>
              <td colSpan={1} className="border border-black p-0 bg-[#e6eeff]"><input type="text" className="w-full h-full p-2 bg-transparent outline-none focus:bg-blue-100" value={(projectForm.printerSpec.trappingBleed as any).minTrap || ''} onChange={e => setProjectForm({...projectForm, printerSpec: {...projectForm.printerSpec, trappingBleed: {...projectForm.printerSpec.trappingBleed, minTrap: e.target.value}}})} /></td>
              <td colSpan={1} className="border border-black p-2 bg-white">Maximum Trap</td>
              <td colSpan={1} className="border border-black p-0 bg-[#e6eeff]"><input type="text" className="w-full h-full p-2 bg-transparent outline-none focus:bg-blue-100" value={(projectForm.printerSpec.trappingBleed as any).maxTrap || ''} onChange={e => setProjectForm({...projectForm, printerSpec: {...projectForm.printerSpec, trappingBleed: {...projectForm.printerSpec.trappingBleed, maxTrap: e.target.value}}})} /></td>
              <td colSpan={1} className="border border-black p-2 bg-white">Standard Trap</td>
              <td colSpan={1} className="border border-black p-0 bg-[#e6eeff]"><input type="text" className="w-full h-full p-2 bg-transparent outline-none focus:bg-blue-100" value={(projectForm.printerSpec.trappingBleed as any).standardTrap || ''} onChange={e => setProjectForm({...projectForm, printerSpec: {...projectForm.printerSpec, trappingBleed: {...projectForm.printerSpec.trappingBleed, standardTrap: e.target.value}}})} /></td>
            </tr>
            <tr>
              <td colSpan={1} className="border border-black p-2 bg-white">Metalic color trap</td>
              <td colSpan={1} className="border border-black p-0 bg-[#e6eeff]"><input type="text" className="w-full h-full p-2 bg-transparent outline-none focus:bg-blue-100" value={(projectForm.printerSpec.trappingBleed as any).metalicTrap || ''} onChange={e => setProjectForm({...projectForm, printerSpec: {...projectForm.printerSpec, trappingBleed: {...projectForm.printerSpec.trappingBleed, metalicTrap: e.target.value}}})} /></td>
              <td colSpan={1} className="border border-black p-2 bg-white">CT Standard trap</td>
              <td colSpan={1} className="border border-black p-0 bg-[#e6eeff]"><input type="text" className="w-full h-full p-2 bg-transparent outline-none focus:bg-blue-100" value={(projectForm.printerSpec.trappingBleed as any).ctStandardTrap || ''} onChange={e => setProjectForm({...projectForm, printerSpec: {...projectForm.printerSpec, trappingBleed: {...projectForm.printerSpec.trappingBleed, ctStandardTrap: e.target.value}}})} /></td>
              <td colSpan={1} className="border border-black p-2 bg-white">CT Minimum trap</td>
              <td colSpan={1} className="border border-black p-0 bg-[#e6eeff]"><input type="text" className="w-full h-full p-2 bg-transparent outline-none focus:bg-blue-100" value={(projectForm.printerSpec.trappingBleed as any).ctMinTrap || ''} onChange={e => setProjectForm({...projectForm, printerSpec: {...projectForm.printerSpec, trappingBleed: {...projectForm.printerSpec.trappingBleed, ctMinTrap: e.target.value}}})} /></td>
            </tr>
            <tr>
              <td colSpan={1} className="border border-black p-2 bg-white">CT Maximum trap</td>
              <td colSpan={1} className="border border-black p-0 bg-[#e6eeff]"><input type="text" className="w-full h-full p-2 bg-transparent outline-none focus:bg-blue-100" value={(projectForm.printerSpec.trappingBleed as any).ctMaxTrap || ''} onChange={e => setProjectForm({...projectForm, printerSpec: {...projectForm.printerSpec, trappingBleed: {...projectForm.printerSpec.trappingBleed, ctMaxTrap: e.target.value}}})} /></td>
              <td colSpan={1} className="border border-black p-2 bg-white">Varnish Trap</td>
              <td colSpan={1} className="border border-black p-0 bg-[#e6eeff]"><input type="text" className="w-full h-full p-2 bg-transparent outline-none focus:bg-blue-100" value={(projectForm.printerSpec.trappingBleed as any).varnishTrap || ''} onChange={e => setProjectForm({...projectForm, printerSpec: {...projectForm.printerSpec, trappingBleed: {...projectForm.printerSpec.trappingBleed, varnishTrap: e.target.value}}})} /></td>
              <td colSpan={1} className="border border-black p-2 bg-white"></td>
              <td colSpan={1} className="border border-black p-0 bg-white"></td>
            </tr>

            {/* Pullback/Holdback */}
            <tr>
              <th colSpan={6} className="border border-black bg-white p-2 text-center font-bold text-sm">Pullback/Holdback</th>
            </tr>
            <tr>
              <td colSpan={1} className="border border-black p-2 bg-white">General Pullback</td>
              <td colSpan={1} className="border border-black p-0 bg-[#e6eeff]"><input type="text" className="w-full h-full p-2 bg-transparent outline-none focus:bg-blue-100" value={(projectForm.printerSpec.pullbackHoldback as any).generalPullback || ''} onChange={e => setProjectForm({...projectForm, printerSpec: {...projectForm.printerSpec, pullbackHoldback: {...projectForm.printerSpec.pullbackHoldback, generalPullback: e.target.value}}})} /></td>
              <td colSpan={1} className="border border-black p-2 bg-white">White pullback 1</td>
              <td colSpan={1} className="border border-black p-0 bg-[#e6eeff]"><input type="text" className="w-full h-full p-2 bg-transparent outline-none focus:bg-blue-100" value={(projectForm.printerSpec.pullbackHoldback as any).whitePullback1 || ''} onChange={e => setProjectForm({...projectForm, printerSpec: {...projectForm.printerSpec, pullbackHoldback: {...projectForm.printerSpec.pullbackHoldback, whitePullback1: e.target.value}}})} /></td>
              <td colSpan={1} className="border border-black p-2 bg-white">White pullback 2</td>
              <td colSpan={1} className="border border-black p-0 bg-[#e6eeff]"><input type="text" className="w-full h-full p-2 bg-transparent outline-none focus:bg-blue-100" value={(projectForm.printerSpec.pullbackHoldback as any).whitePullback2 || ''} onChange={e => setProjectForm({...projectForm, printerSpec: {...projectForm.printerSpec, pullbackHoldback: {...projectForm.printerSpec.pullbackHoldback, whitePullback2: e.target.value}}})} /></td>
            </tr>
            <tr>
              <td colSpan={1} className="border border-black p-2 bg-white">Varnish pullback</td>
              <td colSpan={1} className="border border-black p-0 bg-[#e6eeff]"><input type="text" className="w-full h-full p-2 bg-transparent outline-none focus:bg-blue-100" value={(projectForm.printerSpec.pullbackHoldback as any).varnishPullback || ''} onChange={e => setProjectForm({...projectForm, printerSpec: {...projectForm.printerSpec, pullbackHoldback: {...projectForm.printerSpec.pullbackHoldback, varnishPullback: e.target.value}}})} /></td>
              <td colSpan={1} className="border border-black p-2 bg-white">Keyline</td>
              <td colSpan={1} className="border border-black p-0 bg-[#e6eeff]"><input type="text" className="w-full h-full p-2 bg-transparent outline-none focus:bg-blue-100" value={(projectForm.printerSpec.pullbackHoldback as any).keyline || ''} onChange={e => setProjectForm({...projectForm, printerSpec: {...projectForm.printerSpec, pullbackHoldback: {...projectForm.printerSpec.pullbackHoldback, keyline: e.target.value}}})} /></td>
              <td colSpan={1} className="border border-black p-2 bg-white"></td>
              <td colSpan={1} className="border border-black p-0 bg-white"></td>
            </tr>

            {/* Proofing profile Name */}
            <tr>
              <th colSpan={6} className="border border-black bg-white p-2 text-center font-bold text-sm">Proofing profile Name</th>
            </tr>
            <tr>
              <td colSpan={6} className="border border-black p-0 bg-[#e6eeff] h-10">
                <input type="text" className="w-full h-full p-2 bg-transparent outline-none focus:bg-blue-100" value={projectForm.printerSpec.proofingProfile || ''} onChange={e => setProjectForm({...projectForm, printerSpec: {...projectForm.printerSpec, proofingProfile: e.target.value}})} />
              </td>
            </tr>

            {/* Preferred format */}
            <tr>
              <th colSpan={6} className="border border-black bg-white p-2 text-center font-bold text-sm">Preferred format for final artwork file delivery</th>
            </tr>
            <tr>
              <td colSpan={2} className="border border-black p-0 bg-white h-10 align-middle">
                <label className="flex items-center gap-3 cursor-pointer w-full h-full px-4">
                  <span className="text-sm font-bold text-gray-700">Esko PDF</span>
                  <div className="flex-1 flex justify-end items-center">
                    <input type="radio" name="preferredFormat" value="Esko PDF" checked={projectForm.printerSpec.preferredFormat === 'Esko PDF'} onChange={(e) => setProjectForm({...projectForm, printerSpec: {...projectForm.printerSpec, preferredFormat: e.target.value}})} className="w-5 h-5 text-[#e6eeff] focus:ring-[#e6eeff] bg-[#e6eeff]" />
                  </div>
                </label>
              </td>
              <td colSpan={2} className="border border-black p-0 bg-white h-10 align-middle">
                <label className="flex items-center gap-3 cursor-pointer w-full h-full px-4">
                  <span className="text-sm font-bold text-gray-700">Illustrator CC</span>
                  <div className="flex-1 flex justify-end items-center">
                    <input type="radio" name="preferredFormat" value="Illustrator CC" checked={projectForm.printerSpec.preferredFormat === 'Illustrator CC'} onChange={(e) => setProjectForm({...projectForm, printerSpec: {...projectForm.printerSpec, preferredFormat: e.target.value}})} className="w-5 h-5 text-[#e6eeff] focus:ring-[#e6eeff] bg-[#e6eeff]" />
                  </div>
                </label>
              </td>
              <td colSpan={2} className="border border-black p-0 bg-white h-10 align-middle">
                <label className="flex items-center gap-3 cursor-pointer w-full h-full px-4">
                  <span className="text-sm font-bold text-gray-700">Hi resolution PDF</span>
                  <div className="flex-1 flex justify-end items-center">
                    <input type="radio" name="preferredFormat" value="Hi resolution PDF" checked={projectForm.printerSpec.preferredFormat === 'Hi resolution PDF'} onChange={(e) => setProjectForm({...projectForm, printerSpec: {...projectForm.printerSpec, preferredFormat: e.target.value}})} className="w-5 h-5 text-[#e6eeff] focus:ring-[#e6eeff] bg-[#e6eeff]" />
                  </div>
                </label>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

    </div>
  );
}
