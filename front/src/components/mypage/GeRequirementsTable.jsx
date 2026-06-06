function SubjectCell({ row }) {
  if (row.subjectLines) {
    return (
      <td className="p-3 border-r border-outline-variant/30 text-sm">
        {row.subjectLines.map((line, i) => (
          <span key={line}>
            {line}
            {i < row.subjectLines.length - 1 && <br />}
          </span>
        ))}
      </td>
    );
  }
  return <td className="p-3 border-r border-outline-variant/30">{row.subject}</td>;
}

function GeRequirementsTable({ rows = [] }) {
  return (
    <div className="overflow-x-auto border-t border-b border-primary-container ge-table-wrap">
      <table className="w-full text-left border-collapse ge-table">
        <thead>
          <tr className="bg-primary-container text-on-primary">
            <th className="p-3 font-label-md text-label-md border-r border-primary-fixed-dim/30 w-12 text-center">
              번호
            </th>
            <th
              className="p-3 font-label-md text-label-md border-r border-primary-fixed-dim/30 text-center"
              colSpan={2}
            >
              교양영역
            </th>
            <th
              className="p-3 font-label-md text-label-md border-r border-primary-fixed-dim/30 text-center"
              colSpan={2}
            >
              미수기준(최소)
            </th>
            <th
              className="p-3 font-label-md text-label-md border-r border-primary-fixed-dim/30 text-center"
              colSpan={2}
            >
              취득학점
            </th>
            <th className="p-3 font-label-md text-label-md text-center" colSpan={2}>
              부족학점
            </th>
          </tr>
          <tr className="bg-primary-container text-on-primary border-t border-primary-fixed-dim/30">
            <th className="p-2 border-r border-primary-fixed-dim/30" />
            <th className="p-2 border-r border-primary-fixed-dim/30" />
            <th className="p-2 border-r border-primary-fixed-dim/30" />
            <th className="p-2 font-body-md text-sm border-r border-primary-fixed-dim/30 text-center">
              과목
            </th>
            <th className="p-2 font-body-md text-sm border-r border-primary-fixed-dim/30 text-center">
              학점
            </th>
            <th className="p-2 font-body-md text-sm border-r border-primary-fixed-dim/30 text-center">
              과목
            </th>
            <th className="p-2 font-body-md text-sm border-r border-primary-fixed-dim/30 text-center">
              학점
            </th>
            <th className="p-2 font-body-md text-sm border-r border-primary-fixed-dim/30 text-center">
              과목
            </th>
            <th className="p-2 font-body-md text-sm text-center">학점</th>
          </tr>
        </thead>
        <tbody className="font-body-md text-body-md text-on-surface">
          {rows.map((row) => (
            <tr
              key={row.no}
              className={`border-b border-outline-variant/30 hover:bg-surface-variant/50 transition-colors ${row.rowClass || ''}`}
            >
              <td className="p-3 text-center border-r border-outline-variant/30">{row.no}</td>
              {row.area && (
                <td
                  className="p-3 border-r border-outline-variant/30 align-top"
                  rowSpan={row.areaRowSpan}
                >
                  {row.area}
                </td>
              )}
              <SubjectCell row={row} />
              <td className="p-3 text-center border-r border-outline-variant/30">{row.minSubjects}</td>
              <td className="p-3 text-center border-r border-outline-variant/30">{row.minCredits}</td>
              <td className="p-3 text-center border-r border-outline-variant/30">{row.earnedSubjects}</td>
              <td
                className={`p-3 text-center border-r border-outline-variant/30 ${row.earnedCreditsBold ? 'text-primary font-bold' : ''}`}
              >
                {row.earnedCredits}
              </td>
              <td
                className={`p-3 text-center border-r border-outline-variant/30 ${row.shortHighlight ? 'text-error' : ''}`}
              >
                {row.shortSubjects}
              </td>
              <td className={`p-3 text-center ${row.shortHighlight ? 'text-error' : ''}`}>
                {row.shortCredits}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default GeRequirementsTable;
