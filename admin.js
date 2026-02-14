async function fetchTransactions() {
  const tableBody = document.querySelector('#txTable tbody');
  tableBody.innerHTML = '<tr><td colspan="7">Loading...</td></tr>';
  try {
    const res = await fetch('/api/transactions');
    const data = await res.json();
    if (!data || !data.data) {
      tableBody.innerHTML = '<tr><td colspan="7">No transactions found</td></tr>';
      return;
    }

    const rows = data.data.map(tx => {
      const status = tx.status || 'pending';
      return `<tr>
        <td>${tx.reference}</td>
        <td>${tx.bundle || ''}</td>
        <td>${tx.amount}</td>
        <td>${tx.phoneNumber || ''}</td>
        <td>${tx.paymentMethod || ''}</td>
        <td>${status}</td>
        <td>${status === 'completed' ? '<button disabled>Activated</button>' : `<button data-ref="${tx.reference}" data-bundle="${tx.bundleId || ''}" class="activate">Activate</button>`}</td>
      </tr>`;
    }).join('');

    tableBody.innerHTML = rows || '<tr><td colspan="7">No transactions</td></tr>';
    attachActivateHandlers();
  } catch (err) {
    tableBody.innerHTML = '<tr><td colspan="7">Error loading transactions</td></tr>';
    console.error(err);
  }
}

function attachActivateHandlers() {
  document.querySelectorAll('.activate').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const ref = btn.dataset.ref;
      const bundleId = btn.dataset.bundle || 0;
      btn.disabled = true;
      btn.innerText = 'Activating...';

      try {
        const res = await fetch('/api/activate-bundle', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phoneNumber: getPhoneFromRow(btn), bundleId: bundleId, reference: ref })
        });
        const data = await res.json();
        if (data.status) {
          alert('Bundle activated: ' + (data.message || 'success'));
          await fetchTransactions();
        } else {
          alert('Activation failed: ' + (data.message || 'unknown'));
        }
      } catch (err) {
        console.error(err);
        alert('Activation error');
      }
    });
  });
}

function getPhoneFromRow(btn) {
  const tr = btn.closest('tr');
  const phone = tr.children[3].innerText;
  return phone;
}

document.getElementById('refreshBtn').addEventListener('click', fetchTransactions);

// Initial load
fetchTransactions();
