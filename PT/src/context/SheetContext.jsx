import { createContext, useContext, useState } from "react"

const SheetContext = createContext()

export const SheetProvider = ({ children }) => {
  const [rows, setRows] = useState([])

  return (
    <SheetContext.Provider value={{ rows, setRows }}>
      {children}
    </SheetContext.Provider>
  )
}

export const useSheet = () => useContext(SheetContext)