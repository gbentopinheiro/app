export function generateTestData(count = 10) {
  const firstNames = ['João', 'Maria', 'Pedro', 'Ana', 'Carlos', 'Teresa', 'Rui', 'Sofia', 'Tiago', 'Inês']
  const lastNames = ['Silva', 'Santos', 'Oliveira', 'Sousa', 'Costa', 'Martins', 'Ferreira', 'Gomes', 'Dias', 'Alves']
  const roles = ['carpinteiro', 'trolha', 'ferrajeiro', 'gruista', 'chef_primeira', 'responsavel']
  
  const testPeople = []
  for (let i = 0; i < count; i++) {
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)]
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)]
    testPeople.push({
      id: `test_person_${i + 1}`,
      name: `${firstName} ${lastName}`,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@test.local`,
      role: roles[Math.floor(Math.random() * roles.length)],
      active: true,
      createdAt: new Date().toISOString(),
    })
  }

  const testWorks = []
  const clients = ['Client A', 'Client B', 'Client C', 'Client D']
  for (let i = 0; i < Math.ceil(count / 2); i++) {
    testWorks.push({
      id: `test_work_${i + 1}`,
      name: `Test Obra ${i + 1}`,
      client: clients[Math.floor(Math.random() * clients.length)],
      status: 'active',
      startDate: new Date().toISOString(),
      budget: Math.floor(Math.random() * 50000) + 10000,
      createdAt: new Date().toISOString(),
    })
  }

  const testClients = clients.map((name, idx) => ({
    id: `test_client_${idx + 1}`,
    name,
    email: `${name.toLowerCase()}@test.local`,
    phone: `+351 91 000 000${idx}`,
    active: true,
    createdAt: new Date().toISOString(),
  }))

  const testAssignments = []
  for (let i = 0; i < count; i++) {
    testAssignments.push({
      id: `test_assignment_${i + 1}`,
      personId: testPeople[Math.floor(Math.random() * testPeople.length)].id,
      workId: testWorks[Math.floor(Math.random() * testWorks.length)].id,
      role: 'executor',
      startDate: new Date().toISOString(),
      status: 'active',
      createdAt: new Date().toISOString(),
    })
  }

  return {
    people: testPeople,
    works: testWorks,
    clients: testClients,
    workAssignments: testAssignments,
  }
}

export function generateTestScenarios() {
  return {
    small: generateTestData(5),
    medium: generateTestData(20),
    large: generateTestData(50),
  }
}
