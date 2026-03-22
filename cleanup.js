import { unlinkSync } from 'fs'

const files = ['create-sample.js', 'test-excel.js', 'test-people.js', 'move-file.js']

files.forEach(file => {
  try {
    unlinkSync(file)
    console.log(`Deleted ${file}`)
  } catch (error) {
    console.log(`Could not delete ${file}: ${error.message}`)
  }
})