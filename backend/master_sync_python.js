const mongoose = require('mongoose');
const Lesson = require('./models/Lesson');
const LearningUnit = require('./models/LearningUnit');
require('dotenv').config();

const CURRICULUM_DATA = {
    "Python Essentials & Syntax": {
        "easy": {
            transcript: "Python's design philosophy emphasizes code readability and a syntax that allows programmers to express concepts in fewer lines of code. This module covers core syntax, dynamic typing, and the mandatory 4-space indentation rule.",
            notes: [
                { heading: "01: The Zen of Python Philosophy", paragraphs: ["'Beautiful is better than ugly' is the core principle. Python prioritizes clarity over brevity.", "```python\nimport this\n# Run to see the 19 principles!```"] },
                { heading: "02: Mandatory Indentation (The 4-Space Rule)", paragraphs: ["Python uses whitespace to define blocks. Inconsistent spacing results in INDENTATION ERROR.", "```python\ndef block():\n    print('Indented')```"] },
                { heading: "03: Variable Pointer Mechanics", paragraphs: ["Variables are references (pointers) to objects in memory. The type is determined by the object, not the variable.", "```python\nx = 10\nprint(id(x))```"] },
                { heading: "04: Numerical Operations (Ints & Floats)", paragraphs: ["Integers have arbitrary precision. Floats follow the IEEE 754 standard.", "```python\na = 10; b = 2.5\nprint(a * b) # 25.0```"] },
                { heading: "05: Masterful Strings (The 'str' Type)", paragraphs: ["Strings are sequences of characters. You can use single, double, or triple quotes for blocks.", "```python\ns1 = 'Short'\ns2 = \"\"\"Multi-line\nblock\"\"\"```"] },
                { heading: "06: Dynamic Reassignment Patterns", paragraphs: ["Variables can be reassigned to objects of any type mid-execution.", "```python\nx = 5\nx = 'Now a string'```"] },
                { heading: "07: Interaction Protocols (Input & Output)", paragraphs: ["The print() function sends data out; input() brings data in as a string.", "```python\nval = input('Your Age: ')\nage = int(val)```"] },
                { heading: "08: PEP 8: The Style Guide for Python", paragraphs: ["PEP 8 is the industry standard. Use snake_case for all variables and functions.", "```python\nuser_full_name = 'Flow'```"] }
            ]
        },
        "medium": {
            transcript: "Intermediate syntax explores f-strings, type casting, and slicing mechanics.",
            notes: [
                { heading: "01: F-Strings & Expression Interpolation", paragraphs: ["Modern Pythonic interpolation using curly braces.", "```python\nname = 'Sreya'\nprint(f'{name.upper()} is {26} years old')```"] },
                { heading: "02: Explicit Type Casting Mechanics", paragraphs: ["Manually converting objects: int(), float(), str(), list().", "```python\nraw = '10'\nnum = int(raw)```"] },
                { heading: "03: String Slicing [Start:Stop:Step]", paragraphs: ["The 'stop' index is exclusive. Use -1 for sequence reversal.", "```python\ntext = 'Python'\nprint(text[::-1]) # nohtyP```"] },
                { heading: "04: In-Place Modification vs Creation", paragraphs: ["Strings are immutable. Slicing creates a brand new string.", "```python\ns = 'Mastery'\ns_copy = s[:]```"] },
                { heading: "05: Escape Characters & Literal Printing", paragraphs: ["Use \\n for new lines or 'r' for raw strings (regex/paths).", "```python\nprint(r'C:\\Users\\file')```"] },
                { heading: "06: Multi-line String Application", paragraphs: ["Using triple quotes for block text preservation in SQL or Docs.", "```python\nsql = \"\"\"SELECT * FROM users\"\"\"```"] },
                { heading: "07: Comparison Logic Operators", paragraphs: ["and, or, not. Python supports chained comparisons (1 < x < 10).", "```python\nx = 5; print(1 < x < 10)```"] },
                { heading: "08: Docstrings & Professional Documentation", paragraphs: ["Technical documentation inside function headers.", "```python\ndef add(a, b):\n    'Adding numbers'\n    return a + b```"] }
            ]
        },
        "hard": {
            transcript: "Advanced internals: Identity vs Equality, Mutability, and Memory Management.",
            notes: [
                { heading: "01: Deep-Dive into Identity (id)", paragraphs: ["Access memory addresses directly.", "```python\nx = [1, 2]\nprint(id(x))```"] },
                { heading: "02: Identity (is) vs Value Equality (==)", paragraphs: ["== checks content; 'is' checks memory location.", "```python\na = [1]; b = [1]\nprint(a == b) # True\nprint(a is b) # False```"] },
                { heading: "03: The 'Interning' Optimization", paragraphs: ["Python reuses certain objects (-5 to 256 integers) to save RAM.", "```python\nx = 256; y = 256; print(x is y)```"] },
                { heading: "04: Mutability Hazards in Lists", paragraphs: ["Mutable objects modified in-place affect all references.", "```python\na = [1]; b = a; b.append(2); print(a)```"] },
                { heading: "05: Shallow vs Deep Copying Patterns", paragraphs: ["Use deepcopy for recursive data structures.", "```python\nimport copy\nb = copy.deepcopy(a)```"] },
                { heading: "06: Reference Counting & Garbage Collection", paragraphs: ["Automatic memory cleanup logic.", "```python\nimport sys; x = []; sys.getrefcount(x)```"] },
                { heading: "07: The 'NoneType' Global Singleton", paragraphs: ["Always use 'is' to check against the None singleton.", "```python\nif x is None: pass```"] },
                { heading: "08: Bitwise Flag Logic Mastery", paragraphs: ["Using & and | for low-level state flags.", "```python\na = 0b11; b = 0b10; print(a & b)```"] }
            ]
        }
    },
    "Algorithmic Control Flow": {
        "easy": {
            transcript: "Starting algorithmic logic with If-statements and Loops.",
            notes: [
                { heading: "01: Boolean Truthiness & Falsiness", paragraphs: ["None, 0, and [] are Falsy; almost everything else is Truthy.", "```python\nif not []: print('Empty')```"] },
                { heading: "02: Multi-Path Decision Logic", paragraphs: ["Using if, elif, and else to branch paths.", "```python\nif x > 10: print('High')```"] },
                { heading: "03: Range Generator Mechanics", paragraphs: ["range(start, stop, step) generates items lazily.", "```python\nfor i in range(1, 5): print(i)```"] },
                { heading: "04: The For-Loop: Python's Iterator", paragraphs: ["The standard way to iterate over sequences.", "```python\nfor f in ['apple']: print(f)```"] },
                { heading: "05: While-Loop: The Conditional Loop", paragraphs: ["Loop until a condition changes. Beware of infinite loops.", "```python\nx = 5; while x > 0: x -= 1```"] },
                { heading: "06: Loop-Else (Pythonic Search Patent)", paragraphs: ["The else block runs only if the loop wasn't broken.", "```python\nfor x in [1]: break\nelse: print('Hi')```"] },
                { heading: "07: Breaking to Terminal Logic", paragraphs: ["End any loop instantly with 'break'.", "```python\nwhile True: break```"] },
                { heading: "08: Skipping Iterations with Continue", paragraphs: ["Jump to the next start point instantly.", "```python\nfor i in range(5): continue```"] }
            ]
        },
        "medium": {
            transcript: "Intermediate Flow: List Comprehensions and Nested Logic.",
            notes: [
                { heading: "01: List Comprehension Mastery", paragraphs: ["[expr for item in iterable if cond]", "```python\nsquares = [x*x for x in [1, 2]]```"] },
                { heading: "02: Nested Loop Complexity (Matrices)", paragraphs: ["Grid processing with double for-loops.", "```python\nfor r in grid: \n    for c in r: print(c)```"] },
                { heading: "03: Ternary Conditional Operators", paragraphs: ["msg = 'A' if cond else 'B'", "```python\nmsg = 'Pass' if score > 50 else 'Fail'```"] },
                { heading: "04: The 'Short-Circuit' Performance Win", paragraphs: ["Python stops evaluating an 'and' if the first part is False.", "```python\nif x and costly_check(x): pass```"] },
                { heading: "05: Dictionary Comprehensions", paragraphs: ["Creating key-value sets in one line.", "```python\nd = {x: x*x for x in range(5)}```"] },
                { heading: "06: Set Comprehensions (Uniqueness)", paragraphs: ["Rapid unique collection creation.", "```python\ns = {x for x in 'apple'}```"] },
                { heading: "07: Nested Comprehension Strategy", paragraphs: ["Flattening 2D lists in one line.", "```python\nflat = [v for r in m for v in r]```"] },
                { heading: "08: The 'Pass' Statement (Placeholder)", paragraphs: ["No-op placeholder for future code.", "```python\nif True: pass```"] }
            ]
        },
        "hard": {
            transcript: "Advanced Iteration: Generators and the Iterator Protocol.",
            notes: [
                { heading: "01: Memory-Efficient Generators ()", paragraphs: ["Using parentheses creates a generator, not a list.", "```python\ngen = (x*x for x in range(1000))```"] },
                { heading: "02: Parallel Looping with Zip", paragraphs: ["Synchronized iteration over multiple sequences.", "```python\nfor a, b in zip([1], ['A']): print(a, b)```"] },
                { heading: "03: Enumerate: The Counter Protocol", paragraphs: ["Getting index and object simultaneously.", "```python\nfor i, v in enumerate(['Z']): print(i, v)```"] },
                { heading: "04: Yield: Creating Generator Functions", paragraphs: ["Return multiple values lazily over time.", "```python\ndef count(): yield 1; yield 2```"] },
                { heading: "05: Iterator Protocol Basics", paragraphs: ["Understanding __iter__ and __next__ mechanics.", "```python\nit = iter([1]); print(next(it))```"] },
                { heading: "06: Sequence Analytics: any() & all()", paragraphs: ["Boolean conditions across entire collections.", "```python\nif all(x > 0 for x in [1, 2]): pass```"] },
                { heading: "07: Itertools: Advanced Pipelines", paragraphs: ["Using chain, combinations, and permutations.", "```python\nfrom itertools import chain```"] },
                { heading: "08: Infinite Iteration with Count", paragraphs: ["Creating loops that never terminate for stream testing.", "```python\nfrom itertools import count```"] }
            ]
        }
    },
    "Advanced Data Structures": {
        "easy": {
            transcript: "Mastering Lists and Dictionaries.",
            notes: [
                { heading: "01: Sequence Management (Lists)", paragraphs: ["Mutable ordered sequences: append, insert, pop, remove.", "```python\nl = [1]; l.append(2)```"] },
                { heading: "02: Key-Value Architecture (Dicts)", paragraphs: ["Infinite performance retrieval with hash tables (O(1)).", "```python\nd = {'id': 1}; print(d.get('id'))```"] },
                { heading: "03: Safe Access with .get()", paragraphs: ["Preventing KeyErrors when data is missing.", "```python\nval = d.get('secret', 'N/A')```"] },
                { heading: "04: Dynamic Dictionary Expansion", paragraphs: ["Adding items at runtime effortlessly.", "```python\nd['new'] = 100```"] },
                { heading: "05: List Sorting Mechanics", paragraphs: ["In-place sort() vs global sorted().", "```python\nl.sort(); new = sorted(l)```"] },
                { heading: "06: Membership Testing Performance", paragraphs: ["Comparing 'in' logic across lists and dicts.", "```python\nif 'key' in d: print('Found')```"] },
                { heading: "07: Nested Structure Management", paragraphs: ["Dictionaries inside lists and vice versa.", "```python\ndata = [{'id': 1}, {'id': 2}]```"] },
                { heading: "08: Dictionary View Objects", paragraphs: ["Understanding .keys(), .values(), and .items().", "```python\nfor k, v in d.items(): print(k, v)```"] }
            ]
        },
        "medium": {
            transcript: "Tuples and Sets: Immortality vs Uniqueness.",
            notes: [
                { heading: "01: Immutable Tuples (Read-Only)", paragraphs: ["Fixed collections for constant data records.", "```python\ncoord = (10, 20)```"] },
                { heading: "02: Tuple Unpacking Mechanics", paragraphs: ["Destructuring data into local variables.", "```python\nx, y = coord```"] },
                { heading: "03: Set Theory: Uniqueness & Magic", paragraphs: ["Instant duplicate removal with hashing.", "```python\ns = {1, 2, 2, 3} # Result: {1, 2, 3}```"] },
                { heading: "04: Set Math: Union & Intersection", paragraphs: ["Using & (intersect) and | (union) for membership logic.", "```python\nprint(s1 & s2) # Common items```"] },
                { heading: "05: Memory-Optimized Packing (*args)", paragraphs: ["Packing multiple values into a tuple for storage.", "```python\ndef p(*a): print(a)```"] },
                { heading: "06: Tuple as a Dictionary Key", paragraphs: ["Because tuples are immutable, they are hashable keys.", "```python\nd = {(10, 20): 'Location A'}```"] },
                { heading: "07: Frozenset: The Immutable Set", paragraphs: ["A hashable set that can be used as a dict key.", "```python\nfs = frozenset([1, 2])```"] },
                { heading: "08: Sequence Comparison Logic", paragraphs: ["Tuples and lists comparison (lexicographical order).", "```python\nprint((1, 2) < (1, 3)) # True```"] }
            ]
        },
        "hard": {
            transcript: "Collections & Heaps: Production-Grade Architectures.",
            notes: [
                { heading: "01: Namedtuple: Readable Records", paragraphs: ["Struct-like records with attribute access.", "```python\nfrom collections import namedtuple\nP = namedtuple('P', ['x', 'y'])```"] },
                { heading: "02: Deque: Fast FIFO Queues", paragraphs: ["Performance append/pop from both ends (O(1)).", "```python\nfrom collections import deque\nd = deque([1, 2])```"] },
                { heading: "03: Heapq: Priority Queue Mastery", paragraphs: ["Min-heap implementation for priority-based tasks.", "```python\nimport heapq\nh = []; heapq.heappush(h, 5)```"] },
                { heading: "04: Counter: Frequency Analytics", paragraphs: ["Rapid object counting in one step.", "```python\nfrom collections import Counter\nc = Counter('apple')```"] },
                { heading: "05: Defaultdict & Missing Keys", paragraphs: ["Automatic key initialization with default factories.", "```python\nfrom collections import defaultdict\nd = defaultdict(list)```"] },
                { heading: "06: Bisect: Binary Search Logic", paragraphs: ["Keeping a list sorted without full re-sorting.", "```python\nimport bisect\nbisect.insort(l, 5)```"] },
                { heading: "07: OrderedDict: Preserving Sequence", paragraphs: ["Maintaining key insertion order in legacy Python.", "```python\nfrom collections import OrderedDict```"] },
                { heading: "08: Memoryview: High-Speed Buffer Access", paragraphs: ["Accessing binary data without overhead copying.", "```python\nmv = memoryview(byte_array)```"] }
            ]
        }
    },
    "Functional Programming & Modules": {
        "easy": {
            transcript: "Functional foundations: def and standard imports.",
            notes: [
                { heading: "01: Reusable Logic (def & return)", paragraphs: ["The D.R.Y principle (Don't Repeat Yourself).", "```python\ndef greet(n): return f'Hi {n}'```"] },
                { heading: "02: Default Argument Strategy", paragraphs: ["Making functions flexible with default values.", "```python\ndef add(a, b=10): return a + b```"] },
                { heading: "03: Positional vs Keyword Arguments", paragraphs: ["Mixing order for maximum caller clarity.", "```python\ngreet(name='Flow')```"] },
                { heading: "04: Standard Library Imports", paragraphs: ["Leveraging math, random, and datetime.", "```python\nimport math\nprint(math.sqrt(16))```"] },
                { heading: "05: Modular Extraction (from ... import)", paragraphs: ["Importing only what you need to save memory.", "```python\nfrom random import randint```"] },
                { heading: "06: Function Scope Hierarchy", paragraphs: ["Local variables vs global variables.", "```python\nx = 10 # Global\ndef f(): x = 5 # Local```"] },
                { heading: "07: The 'None' Return Implicitly", paragraphs: ["Functions without a 'return' send 'None' by default.", "```python\ndef dummy(): pass\nprint(dummy()) # None```"] },
                { heading: "08: Docstring-First Documentation", paragraphs: ["Professional headers for every logic block.", "```python\ndef f(): \"\"\"Header\"\"\"```"] }
            ]
        },
        "medium": {
            transcript: "Intermediate Functional: Lambdas and Higher-Order Functions.",
            notes: [
                { heading: "01: Lambda Expressions (Anonymous)", paragraphs: ["Single-line throwaway functions.", "```python\nadd = lambda x, y: x + y```"] },
                { heading: "02: Higher-Order Mapping", paragraphs: ["Applying logic across sequences: map().", "```python\nl = list(map(lambda x: x*2, [1, 2]))```"] },
                { heading: "03: Higher-Order Filtering", paragraphs: ["Filtering sequences with filter().", "```python\nl = list(filter(lambda x: x > 0, [-1, 1]))```"] },
                { heading: "04: Variable Arguments (*args)", paragraphs: ["Handling an unknown number of positional inputs.", "```python\ndef f(*args): print(args)```"] },
                { heading: "05: Keyword Variable Arguments (**kwargs)", paragraphs: ["Handling an unknown number of named inputs.", "```python\ndef f(**kw): print(kw)```"] },
                { heading: "06: Reducing Sequences (reduce)", paragraphs: ["Accumulating values from left to right.", "```python\nfrom functools import reduce\nreduce(lambda a, b: a+b, [1, 2, 3])```"] },
                { heading: "07: First-Class Object Mechanics", paragraphs: ["Assigning functions to variables and passing them.", "```python\ndef f(): pass\ng = f```"] },
                { heading: "08: __init__.py & Package Architecture", paragraphs: ["Transforming directories into importable packages.", "```python\n# folder/__init__.py```"] }
            ]
        },
        "hard": {
            transcript: "Expert Functional: Closures, Decorators, and Scope Mastery.",
            notes: [
                { heading: "01: Closures: Environment Persistence", paragraphs: ["Functions that remember their creation scope.", "```python\ndef m(f): return lambda x: x * f\ndouble = m(2)```"] },
                { heading: "02: Decorator Patterns (@syntax)", paragraphs: ["Wrapping logic without source modification.", "```python\n@log\ndef work(): pass```"] },
                { heading: "03: The functools.wraps Safeguard", paragraphs: ["Preserving function metadata in decorators.", "```python\nfrom functools import wraps```"] },
                { heading: "04: Nonlocal Scope Management", paragraphs: ["Accessing and modifying the outer (but non-global) scope.", "```python\ndef f(): \n  x = 0\n  def g(): nonlocal x; x += 1```"] },
                { heading: "05: Class-Based Decorators", paragraphs: ["Using the __call__ method for stateful decorators.", "```python\nclass Log: def __call__(self, f): pass```"] },
                { heading: "06: Property Decorators (@property)", paragraphs: ["Creating managed attributes in classes.", "```python\n@property\ndef name(self): return self._name```"] },
                { heading: "07: Context Managers (@contextmanager)", paragraphs: ["Using yield for with-statement setup/teardown.", "```python\nfrom contextlib import contextmanager```"] },
                { heading: "08: Abstracting with Partial Functions", paragraphs: ["Pre-filling function arguments for future use.", "```python\nfrom functools import partial\ndouble = partial(mul, 2)```"] }
            ]
        }
    }
};

async function syncUltima() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/learnflow");
        console.log("Connected to Ultima Neural Database...");

        const lessons = await Lesson.find({});
        for (const lesson of lessons) {
            if (CURRICULUM_DATA[lesson.title]) {
                const data = CURRICULUM_DATA[lesson.title];
                for (const complexity of ['easy', 'medium', 'hard']) {
                    const unit = await LearningUnit.findOne({ lessonId: lesson._id, complexity: complexity });
                    if (unit) {
                        unit.auditory_transcript = data[complexity].transcript;
                        unit.readwrite_notes = data[complexity].notes;
                        unit.content_text = data[complexity].transcript;
                        await unit.save();
                        console.log(`   - [ULTIMA SYNCED] ${lesson.title} - ${complexity}`);
                    }
                }
            }
        }
        console.log("\nUltima Total Overhaul Complete.");
        process.exit(0);
    } catch (err) {
        console.log("Sync Failed:", err);
        process.exit(1);
    }
}
syncUltima();
