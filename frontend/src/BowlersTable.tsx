/* eslint-disable */
import { useEffect, useState } from 'react';
import { Bowler } from './types/Bowler';

function BowlersTable(props: any) {
  const [bowlerData, setBowlerData] = useState<Bowler[]>([]);
  const [sortAsc, setSortAsc] = useState(false);

  // Updated to handle errors thrown when the backend isn't running (generated w/ help from ChatGPT)
  useEffect(() => {
    const fetchBowlerData = async () => {
      try {
        const rsp = await fetch('http://localhost:5231/api/BowlingLeague');
        if (!rsp.ok) {
          throw new Error('Failed to fetch data');
        }
        const b = await rsp.json();
        setBowlerData(b || []); // Set empty array if response is falsy
      } catch (error) {
        console.error('Error fetching data:', error);
        setBowlerData([]); // Set empty array in case of error
      }
    };

    fetchBowlerData();
  }, []);

  const filteredTeamNames = props.displayTeams;

  // BUG-2 (Null/Empty Guard): filter runs before the null check below —
  // if props.displayTeams is undefined this line throws TypeError
  var filteredBowlers = bowlerData;

  filteredBowlers = bowlerData.filter((b) =>
    filteredTeamNames.includes(b.team?.teamName),
  );

  // BUG-3 (Comparison Type Fix): bowlerId is converted to string before
  // comparison, so sorting is lexicographic not numeric.
  const sortedBowlers = [...filteredBowlers].sort((a, b) => {
    const idA = String(a.bowlerId);
  const idB = String(b.bowlerId);

  // lexicographic comparison
  return sortAsc
    ? idA.localeCompare(idB)
    : idB.localeCompare(idA);
});

  return (
    <div>
      <div className="row">
        <button
          className="btn btn-sm btn-outline-secondary mb-2"
          onClick={() => setSortAsc((prev) => !prev)}
        >
          Sort by ID ({sortAsc ? 'Asc' : 'Desc'})
        </button>
        <table className="table table-bordered">
          <thead>
            <tr>
              <th>ID</th>
              <th>Last Name</th>
              {/* BUG-1 (UI Label): "First Names" should be "First Name" */}
              <th>First Names</th>
              <th>Address</th>
              <th>Phone</th>
              <th>Team</th>
            </tr>
          </thead>
          <tbody>
            {sortedBowlers.map((b) => (
              <tr key={b.bowlerId}>
                <td>{b.bowlerId}</td>
                <td>{b.bowlerLastName}</td>
                <td>
                  {b.bowlerFirstName}{' '}
                  {/* BUG-4 (DTO Default Value): guard removed — when API returns
                      null for bowlerMiddleInit this renders "null." */}
                  {b.bowlerMiddleInit ? b.bowlerMiddleInit + '.' : ''}
                </td>
                <td>
                  {b.bowlerAddress}, {b.bowlerCity}, {b.bowlerState}{' '}
                  {/* BUG-5 (Export Formatting): bowlerZip is typed as number so
                      leading-zero zips (e.g. 02134) are truncated to 2134 */}
                  {String(b.bowlerZip).padStart(5, '0')}
                </td>
                <td>{b.bowlerPhoneNumber}</td>
                <td>{b.team?.teamName}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default BowlersTable;
 
