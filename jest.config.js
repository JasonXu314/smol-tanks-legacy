module.exports = {
	roots: ['.'],
	moduleFileExtensions: ['js', 'ts', 'tsx', 'json'],
	testPathIgnorePatterns: ['.[/\\\\](node_modules|.next)[/\\\\]'],
	transformIgnorePatterns: ['[/\\\\]node_modules[/\\\\].+\\.(ts|tsx)$'],
	transform: {
		'^.+\\.(ts|tsx)$': 'babel-jest'
	},
	moduleNameMapper: {
		'\\$/(.*)': '<rootDir>/components/$1',
		'@/(.*)': '<rootDir>/utils/$1',
		'^utils/*': '<rootDir>/utils/$1'
	}
};
