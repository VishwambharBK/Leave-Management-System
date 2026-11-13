import React, { useState, useEffect } from 'react';
import adminService from '../../services/adminService';
import toast from 'react-hot-toast';
import { Settings2, Save, Info, ShieldAlert } from 'lucide-react';

export const LeavePolicyPage = () => {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);

  const fetchPolicies = async (selectedYear) => {
    setLoading(true);
    try {
      const res = await adminService.getPolicies(selectedYear);
      if (res.data) {
        setPolicies(res.data);
      }
    } catch (err) {
      toast.error('Failed to load leave policies.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPolicies(year);
  }, [year]);

  const handleAllocationChange = (id, newVal) => {
    const val = Math.max(0, parseInt(newVal, 10) || 0);
    setPolicies((prev) =>
      prev.map((p) => (p._id === id ? { ...p, annualAllocation: val } : p))
    );
  };

  const handleAttachmentToggle = (id) => {
    setPolicies((prev) =>
      prev.map((p) => (p._id === id ? { ...p, requiresAttachment: !p.requiresAttachment } : p))
    );
  };

  const handleSavePolicy = async (policy) => {
    setSavingId(policy._id);
    try {
      await adminService.updatePolicy(policy._id, {
        annualAllocation: policy.annualAllocation,
        requiresAttachment: policy.requiresAttachment,
      });
      toast.success(`${policy.leaveType} policy updated successfully!`);
    } catch (err) {
      toast.error(err.message || 'Failed to update policy.');
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Leave Policy Configuration</h2>
          <p className="text-sm text-slate-500">
            Set company-wide annual quotas and document verification requirements.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500">Policy Year:</span>
          <select
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value, 10))}
            className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 shadow-xs focus:outline-none focus:ring-1 focus:ring-blue-600"
          >
            {[currentYear - 1, currentYear, currentYear + 1].map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Information Banner */}
      <div className="rounded-2xl border border-blue-200 bg-blue-50/70 p-4 text-xs text-blue-900">
        <div className="flex items-start gap-2.5">
          <Info className="h-5 w-5 shrink-0 text-blue-600 mt-0.5" />
          <div>
            <h4 className="font-semibold">Policy Update Implications</h4>
            <p className="mt-0.5 text-blue-800">
              Changes to annual allocation take effect dynamically for all employees during the selected leave year.
              Authoritative balances reflect these changes upon next calculation.
            </p>
          </div>
        </div>
      </div>

      {/* Policy Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-3 py-12 text-center">
            <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
          </div>
        ) : (
          policies.map((policy) => (
            <div
              key={policy._id}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="font-bold text-slate-900 text-base">{policy.leaveType}</h3>
                  <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
                    Year {policy.year}
                  </span>
                </div>

                <div className="mt-5 space-y-4">
                  {/* Quota Input */}
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                      Annual Allocation (Days)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="365"
                      value={policy.annualAllocation}
                      onChange={(e) => handleAllocationChange(policy._id, e.target.value)}
                      className="mt-1.5 block w-full rounded-xl border border-slate-300 p-2.5 text-sm font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
                    />
                  </div>

                  {/* Attachment Required Toggle */}
                  <div className="pt-2">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={policy.requiresAttachment}
                        onChange={() => handleAttachmentToggle(policy._id)}
                        className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-xs font-medium text-slate-700">
                        Require Supporting Document
                      </span>
                    </label>
                    <p className="mt-1 text-[11px] text-slate-400 pl-7">
                      If checked, employees must attach a medical certificate or supporting document when applying.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end">
                <button
                  type="button"
                  disabled={savingId === policy._id}
                  onClick={() => handleSavePolicy(policy)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 disabled:opacity-50 transition"
                >
                  <Save className="h-3.5 w-3.5" />
                  <span>{savingId === policy._id ? 'Saving...' : 'Save Policy'}</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default LeavePolicyPage;

